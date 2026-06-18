import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Trash2 } from "lucide-react";
import api, { extractError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/format";
import BackButton from "@/components/BackButton";

export default function Orders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/orders")
      .then((res) => setList(res.data))
      .catch((err) => toast.error(extractError(err, "Failed to load orders")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const doDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/orders/${id}`);
      toast.success("Order deleted successfully. Stock restored.");
      load();
    } catch (err) {
      toast.error(extractError(err, "Failed to delete order"));
    }
  };

  return (
    <div className="space-y-6" data-testid="orders-page">
      <BackButton />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Orders</h2>
          <p className="mt-1 text-sm text-slate-500">View and manage customer orders.</p>
        </div>
        <Button asChild data-testid="create-order-btn">
          <Link to="/orders/new">
            <Plus className="mr-2 h-4 w-4" /> Create Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500" data-testid="orders-empty">
              No orders yet. Click "Create Order" to place a new one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="orders-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Placed At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((o) => (
                    <TableRow key={o.id} data-testid={`order-row-${o.id}`}>
                      <TableCell className="font-mono text-xs text-slate-700">
                        #{String(o.id).padStart(5, "0")}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {o.customer_name}
                      </TableCell>
                      <TableCell className="text-right text-slate-700">{o.item_count}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatINR(o.total_amount)}
                      </TableCell>
                      <TableCell className="text-slate-700">{formatDate(o.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            data-testid={`view-order-${o.id}`}
                          >
                            <Link to={`/orders/${o.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteId(o.id)}
                            data-testid={`delete-order-${o.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent data-testid="delete-order-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel / Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the order and restore the items back to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
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
