import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import api, { extractError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/format";
import BackButton from "@/components/BackButton";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => toast.error(extractError(err, "Failed to load order")))
      .finally(() => setLoading(false));
  }, [id]);

  const doDelete = async () => {
    setConfirmDelete(false);
    try {
      await api.delete(`/orders/${id}`);
      toast.success("Order deleted successfully. Stock restored.");
      navigate("/orders");
    } catch (err) {
      toast.error(extractError(err, "Failed to delete order"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-sm text-slate-500">Order not found.</div>;
  }

  return (
    <div className="space-y-6" data-testid="order-detail-page">
      <div className="flex items-center justify-between gap-2">
        <BackButton fallbackTo="/orders" />
        <Button
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setConfirmDelete(true)}
          data-testid="delete-order-btn"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Order
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Order #{String(order.id).padStart(5, "0")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Placed on {formatDate(order.created_at)}</p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Name</div>
            <div className="mt-1 font-medium text-slate-900" data-testid="order-customer-name">
              {order.customer_name}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
            <div className="mt-1 text-slate-700">{order.customer_email}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Customer ID</div>
            <div className="mt-1 font-mono text-xs text-slate-700">#{order.customer_id}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-testid="order-items-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it) => (
                  <TableRow key={it.id} data-testid={`order-item-${it.id}`}>
                    <TableCell className="font-medium text-slate-900">{it.product_name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {it.sku_code}
                    </TableCell>
                    <TableCell className="text-right">{formatINR(it.price_at_purchase)}</TableCell>
                    <TableCell className="text-right">{it.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatINR(it.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-6 border-t border-slate-200 px-6 py-4">
            <span className="text-sm text-slate-500">Total amount</span>
            <span
              className="text-2xl font-semibold tracking-tight text-slate-900"
              data-testid="order-total-amount"
            >
              {formatINR(order.total_amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent data-testid="delete-order-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              The order will be removed and its items will be restored to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-order"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
