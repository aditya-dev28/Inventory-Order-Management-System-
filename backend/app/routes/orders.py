"""Order API routes with multi-product support and atomic stock handling."""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas import OrderCreate, OrderListItem, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


def _serialize_order(order: Order) -> dict:
    items = []
    for item in order.items:
        items.append(
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.product_name if item.product else "",
                "sku_code": item.product.sku_code if item.product else "",
                "quantity": item.quantity,
                "price_at_purchase": item.price_at_purchase,
                "line_total": (Decimal(item.price_at_purchase) * item.quantity),
            }
        )
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else "",
        "customer_email": order.customer.email if order.customer else "",
        "total_amount": order.total_amount,
        "created_at": order.created_at,
        "items": items,
    }


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Aggregate duplicates by product_id
    aggregated: dict[int, int] = {}
    for it in payload.items:
        aggregated[it.product_id] = aggregated.get(it.product_id, 0) + it.quantity

    product_ids = list(aggregated.keys())
    # Lock product rows to prevent concurrent stock issues
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )
    product_map = {p.id: p for p in products}

    # Validate every product exists
    for pid in product_ids:
        if pid not in product_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"Product not found: id={pid}"
            )

    # Validate stock for every product
    for pid, qty in aggregated.items():
        p = product_map[pid]
        if p.quantity_in_stock < qty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for '{p.product_name}' (SKU {p.sku_code}). "
                    f"Available: {p.quantity_in_stock}, requested: {qty}"
                ),
            )

    # Create order
    order = Order(customer_id=customer.id, total_amount=Decimal("0"))
    db.add(order)
    db.flush()  # to obtain order.id

    total = Decimal("0")
    for pid, qty in aggregated.items():
        p = product_map[pid]
        line_price = Decimal(p.price)
        line_total = line_price * qty
        total += line_total
        # Reduce stock
        p.quantity_in_stock -= qty
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=p.id,
                quantity=qty,
                price_at_purchase=line_price,
            )
        )

    order.total_amount = total

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order"
        )

    db.refresh(order)
    # Eager-load relationships for response
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order.id)
        .first()
    )
    return _serialize_order(order)


@router.get("", response_model=list[OrderListItem])
def list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.customer))
        .order_by(Order.id.desc())
        .all()
    )
    return [
        OrderListItem(
            id=o.id,
            customer_id=o.customer_id,
            customer_name=o.customer.full_name if o.customer else "",
            total_amount=o.total_amount,
            item_count=len(o.items),
            created_at=o.created_at,
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _serialize_order(order)


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Restore stock
    product_ids = [it.product_id for it in order.items]
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )
    pmap = {p.id: p for p in products}
    for it in order.items:
        p = pmap.get(it.product_id)
        if p is not None:
            p.quantity_in_stock += it.quantity

    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully and stock restored", "id": order_id}
