"""Seed PostgreSQL with Indian demo data on first startup."""
from decimal import Decimal
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models import Customer, Product


# (full_name, email, phone, address_line1, address_line2, city, state, postal_code)
CUSTOMERS = [
    (
        "Rahul Sharma", "rahul.sharma@example.in", "+91 98765 43210",
        "12 MG Road", "Sector 5", "Bengaluru", "Karnataka", "560001",
    ),
    (
        "Priya Verma", "priya.verma@example.in", "+91 98123 45678",
        "88 Park Street", None, "Kolkata", "West Bengal", "700016",
    ),
    (
        "Amit Kumar", "amit.kumar@example.in", "+91 99887 76655",
        "45 Connaught Place", None, "New Delhi", "Delhi", "110001",
    ),
    (
        "Sneha Gupta", "sneha.gupta@example.in", "+91 98101 12345",
        "23 Linking Road", "Bandra West", "Mumbai", "Maharashtra", "400050",
    ),
    (
        "Neha Agarwal", "neha.agarwal@example.in", "+91 97600 33221",
        "9 Banjara Hills", "Road No 3", "Hyderabad", "Telangana", "500034",
    ),
    (
        "Ankit Singh", "ankit.singh@example.in", "+91 90011 22334",
        "67 Anna Salai", None, "Chennai", "Tamil Nadu", "600002",
    ),
]

PRODUCTS = [
    ("Wireless Mouse", "WM-001", Decimal("799.00"), 50),
    ("Wireless Keyboard", "WK-002", Decimal("1899.00"), 35),
    ("Laptop Stand", "LS-003", Decimal("1299.00"), 20),
    ("Monitor", "MN-004", Decimal("12499.00"), 8),
    ("USB Cable", "UC-005", Decimal("199.00"), 200),
    ("Printer Cartridge", "PC-006", Decimal("2299.00"), 6),
    ("Power Bank", "PB-007", Decimal("1599.00"), 40),
    ("Office Chair", "OC-008", Decimal("8499.00"), 5),
    ("Desk Organizer", "DO-009", Decimal("649.00"), 30),
    ("Notebook Bundle", "NB-010", Decimal("499.00"), 100),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Customer).count() == 0:
        for (full_name, email, phone, addr1, addr2, city, state, postal) in CUSTOMERS:
            db.add(Customer(
                full_name=full_name, email=email, phone_number=phone,
                address_line1=addr1, address_line2=addr2,
                city=city, state=state, postal_code=postal,
            ))
    if db.query(Product).count() == 0:
        for name, sku, price, qty in PRODUCTS:
            db.add(Product(product_name=name, sku_code=sku, price=price, quantity_in_stock=qty))
    db.commit()


def backfill_seed_addresses(db: Session) -> None:
    """Idempotently populate addresses for seed customers that were
    created before the address columns existed (empty address_line1)."""
    for (full_name, email, phone, addr1, addr2, city, state, postal) in CUSTOMERS:
        db.execute(
            update(Customer)
            .where(Customer.email == email, Customer.address_line1 == "")
            .values(
                address_line1=addr1,
                address_line2=addr2,
                city=city,
                state=state,
                postal_code=postal,
            )
        )
    db.commit()
