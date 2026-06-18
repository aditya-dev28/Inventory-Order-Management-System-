import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api, { extractError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatINR } from "@/lib/format";
import BackButton from "@/components/BackButton";

const EMPTY = { product_name: "", sku_code: "", price: "", quantity_in_stock: "" };
const LOW_STOCK = 10;

export default function Products() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/products")
      .then((res) => setList(res.data))
      .catch((err) => toast.error(extractError(err, "Failed to load products")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      product_name: p.product_name,
      sku_code: p.sku_code,
      price: String(p.price),
      quantity_in_stock: String(p.quantity_in_stock),
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.product_name.trim()) e.product_name = "Product name is required";
    if (!form.sku_code.trim()) e.sku_code = "SKU is required";
    const price = Number(form.price);
    if (form.price === "" || Number.isNaN(price)) e.price = "Price is required";
    else if (price < 0) e.price = "Price cannot be negative";
    const qty = Number(form.quantity_in_stock);
    if (form.quantity_in_stock === "" || Number.isNaN(qty))
      e.quantity_in_stock = "Quantity is required";
    else if (!Number.isInteger(qty) || qty < 0)
      e.quantity_in_stock = "Quantity must be a non-negative integer";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      product_name: form.product_name.trim(),
      sku_code: form.sku_code.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/products", payload);
        toast.success("Product created successfully");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(extractError(err, "Failed to save product"));
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted successfully");
      load();
    } catch (err) {
      toast.error(extractError(err, "Failed to delete product"));
    }
  };

  return (
    <div className="space-y-6" data-testid="products-page">
      <BackButton />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Products</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your product catalog and stock.</p>
        </div>
        <Button onClick={openCreate} data-testid="add-product-btn">
          <Plus className="mr-2 h-4 w-4" /> Add Product
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
            <div className="p-10 text-center text-sm text-slate-500" data-testid="products-empty">
              No products yet. Click "Add Product" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="products-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id} data-testid={`product-row-${p.id}`}>
                      <TableCell className="font-medium text-slate-900">{p.product_name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {p.sku_code}
                      </TableCell>
                      <TableCell className="text-right text-slate-700">
                        {formatINR(p.price)}
                      </TableCell>
                      <TableCell className="text-right text-slate-700">
                        {p.quantity_in_stock}
                      </TableCell>
                      <TableCell>
                        {p.quantity_in_stock === 0 ? (
                          <Badge variant="destructive">Out of stock</Badge>
                        ) : p.quantity_in_stock <= LOW_STOCK ? (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                            Low stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            In stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(p)}
                            data-testid={`edit-product-${p.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteId(p.id)}
                            data-testid={`delete-product-${p.id}`}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update product details." : "Enter the product details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                data-testid="input-product-name"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />
              {errors.product_name && (
                <p className="text-xs text-red-600" data-testid="err-product-name">
                  {errors.product_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku_code">SKU Code</Label>
              <Input
                id="sku_code"
                data-testid="input-product-sku"
                value={form.sku_code}
                onChange={(e) => setForm({ ...form, sku_code: e.target.value })}
              />
              {errors.sku_code && (
                <p className="text-xs text-red-600" data-testid="err-product-sku">
                  {errors.sku_code}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (INR)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  data-testid="input-product-price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                {errors.price && (
                  <p className="text-xs text-red-600" data-testid="err-product-price">
                    {errors.price}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
                <Input
                  id="quantity_in_stock"
                  type="number"
                  min="0"
                  step="1"
                  data-testid="input-product-quantity"
                  value={form.quantity_in_stock}
                  onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
                />
                {errors.quantity_in_stock && (
                  <p className="text-xs text-red-600" data-testid="err-product-quantity">
                    {errors.quantity_in_stock}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="cancel-product-btn"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} data-testid="submit-product-btn">
                {submitting ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent data-testid="delete-product-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product. If the product is part of any order, the
              deletion will be rejected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-product"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
