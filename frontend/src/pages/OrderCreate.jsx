import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api, { extractError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import BackButton from "@/components/BackButton";

export default function OrderCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState([{ product_id: "", quantity: 1 }]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([api.get("/customers"), api.get("/products")])
      .then(([c, p]) => {
        setCustomers(c.data);
        setProducts(p.data);
      })
      .catch((err) => toast.error(extractError(err, "Failed to load data")))
      .finally(() => setLoading(false));
  }, []);

  const productById = useMemo(() => {
    const m = {};
    for (const p of products) m[p.id] = p;
    return m;
  }, [products]);

  const addRow = () => setRows((r) => [...r, { product_id: "", quantity: 1 }]);
  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));
  const updateRow = (idx, key, value) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));

  // Aggregate planned qty per product for stock validation across duplicate rows
  const plannedByProduct = useMemo(() => {
    const m = {};
    for (const r of rows) {
      if (!r.product_id) continue;
      const q = Number(r.quantity) || 0;
      m[r.product_id] = (m[r.product_id] || 0) + q;
    }
    return m;
  }, [rows]);

  const total = useMemo(() => {
    let t = 0;
    for (const r of rows) {
      const p = productById[r.product_id];
      const qty = Number(r.quantity) || 0;
      if (p && qty > 0) t += Number(p.price) * qty;
    }
    return t;
  }, [rows, productById]);

  const validate = () => {
    const e = {};
    if (!customerId) e.customer = "Please select a customer";
    if (rows.length === 0) e.items = "Add at least one product";
    rows.forEach((r, i) => {
      if (!r.product_id) e[`row_${i}_product`] = "Select a product";
      const qty = Number(r.quantity);
      if (!Number.isInteger(qty) || qty <= 0) e[`row_${i}_qty`] = "Quantity must be ≥ 1";
      else {
        const p = productById[r.product_id];
        const planned = plannedByProduct[r.product_id] || 0;
        if (p && planned > p.quantity_in_stock) {
          e[`row_${i}_qty`] = `Exceeds available stock (${p.quantity_in_stock})`;
        }
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        customer_id: Number(customerId),
        items: rows.map((r) => ({
          product_id: Number(r.product_id),
          quantity: Number(r.quantity),
        })),
      };
      const res = await api.post("/orders", payload);
      toast.success("Order created successfully");
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(extractError(err, "Failed to create order"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="space-y-6" data-testid="order-create-page">
      <div className="flex items-center gap-2">
        <BackButton fallbackTo="/orders" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Create Order</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a customer, add one or more products, review and confirm.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Step 1 · Customer</CardTitle>
          </CardHeader>
          <CardContent className="max-w-md">
            <Label htmlFor="customer">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer" className="mt-2" data-testid="select-customer">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={String(c.id)}
                    data-testid={`customer-option-${c.id}`}
                  >
                    {c.full_name} · {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer && (
              <p className="mt-2 text-xs text-red-600" data-testid="err-customer">
                {errors.customer}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Step 2 · Products</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addRow} data-testid="add-row-btn">
              <Plus className="mr-1 h-4 w-4" /> Add product
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((row, idx) => {
              const p = productById[row.product_id];
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end"
                  data-testid={`order-item-row-${idx}`}
                >
                  <div className="sm:col-span-6">
                    <Label htmlFor={`product-${idx}`}>Product</Label>
                    <Select
                      value={row.product_id}
                      onValueChange={(v) => updateRow(idx, "product_id", v)}
                    >
                      <SelectTrigger
                        id={`product-${idx}`}
                        className="mt-2"
                        data-testid={`select-product-${idx}`}
                      >
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((pp) => (
                          <SelectItem
                            key={pp.id}
                            value={String(pp.id)}
                            disabled={pp.quantity_in_stock === 0}
                            data-testid={`product-option-${pp.id}`}
                          >
                            {pp.product_name} · {formatINR(pp.price)} · stock {pp.quantity_in_stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`row_${idx}_product`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`row_${idx}_product`]}</p>
                    )}
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor={`qty-${idx}`}>Quantity</Label>
                    <Input
                      id={`qty-${idx}`}
                      type="number"
                      min="1"
                      step="1"
                      max={p ? p.quantity_in_stock : undefined}
                      className="mt-2"
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                      data-testid={`input-quantity-${idx}`}
                    />
                    {errors[`row_${idx}_qty`] && (
                      <p className="mt-1 text-xs text-red-600" data-testid={`err-quantity-${idx}`}>
                        {errors[`row_${idx}_qty`]}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="invisible">Subtotal</Label>
                    <div className="mt-2 h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm leading-10 text-slate-700">
                      {p && row.quantity
                        ? formatINR(Number(p.price) * Number(row.quantity || 0))
                        : "—"}
                    </div>
                  </div>
                  <div className="sm:col-span-1 sm:flex sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length === 1}
                      data-testid={`remove-row-${idx}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Step 3 · Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const p = productById[r.product_id];
                    if (!p) return null;
                    const qty = Number(r.quantity) || 0;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-slate-900">
                          {p.product_name}{" "}
                          <Badge variant="outline" className="ml-2 font-mono text-[10px]">
                            {p.sku_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatINR(p.price)}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(Number(p.price) * qty)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-end gap-6 border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-500">Total amount</span>
              <span
                className="text-2xl font-semibold tracking-tight text-slate-900"
                data-testid="order-total-preview"
              >
                {formatINR(total)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild data-testid="cancel-create-order">
            <Link to="/orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting} data-testid="confirm-order-btn">
            {submitting ? "Placing order..." : "Confirm Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
