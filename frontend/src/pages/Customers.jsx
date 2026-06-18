import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import BackButton from "@/components/BackButton";

const EMPTY = {
  full_name: "",
  email: "",
  phone_number: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const POSTAL_RE = /^[A-Za-z0-9\s-]{3,20}$/;

function countDigits(s) {
  return (s.match(/\d/g) || []).length;
}

export default function Customers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/customers")
      .then((res) => setList(res.data))
      .catch((err) => toast.error(extractError(err, "Failed to load customers")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Filtered list — name / email / phone / city / state / postal code
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone_number.toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.state || "").toLowerCase().includes(q) ||
        (c.postal_code || "").toLowerCase().includes(q)
    );
  }, [list, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      email: c.email,
      phone_number: c.phone_number,
      address_line1: c.address_line1 || "",
      address_line2: c.address_line2 || "",
      city: c.city || "",
      state: c.state || "",
      postal_code: c.postal_code || "",
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      e.email = "Enter a valid email address";
    }

    const phone = form.phone_number.trim();
    if (!phone) {
      e.phone_number = "Phone number is required";
    } else if (!PHONE_RE.test(phone)) {
      e.phone_number = "Enter a valid phone number";
    } else if (countDigits(phone) < 10) {
      e.phone_number = "Phone number must contain at least 10 digits";
    }

    if (!form.address_line1.trim()) e.address_line1 = "Address Line 1 is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";

    const postal = form.postal_code.trim();
    if (!postal) {
      e.postal_code = "Postal code / PIN code is required";
    } else if (!POSTAL_RE.test(postal)) {
      e.postal_code = "Enter a valid postal / PIN code";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
    };
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
        toast.success("Customer updated successfully");
      } else {
        await api.post("/customers", payload);
        toast.success("Customer created successfully");
      }
      setOpen(false);
      load();
    } catch (err) {
      const msg = extractError(err, "Failed to save customer");
      // Friendlier mapping for known cases
      if (/email already exists/i.test(msg)) {
        toast.error("Email already exists");
      } else if (/phone/i.test(msg)) {
        toast.error("Invalid phone number");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    const c = deleteTarget;
    setDeleteTarget(null);
    if (!c) return;
    try {
      await api.delete(`/customers/${c.id}`);
      toast.success("Customer deleted successfully");
      load();
    } catch (err) {
      toast.error(extractError(err, "Failed to delete customer"));
    }
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <BackButton />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Customers</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your customer directory.</p>
        </div>
        <Button onClick={openCreate} data-testid="add-customer-btn">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Search by name, email or phone number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          data-testid="customer-search-input"
        />
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
            <div
              className="flex flex-col items-center justify-center gap-3 p-12 text-center"
              data-testid="customers-empty"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">No customers yet</div>
                <p className="mt-1 text-sm text-slate-500">
                  Get started by adding your first customer.
                </p>
              </div>
              <Button onClick={openCreate} data-testid="empty-add-customer-btn">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="p-10 text-center text-sm text-slate-500"
              data-testid="customers-no-results"
            >
              No customers match &quot;{query}&quot;. Try a different search term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="customers-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const fullAddress = [
                      c.address_line1,
                      c.address_line2,
                      c.city,
                      c.state,
                      c.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    const compact = [c.city, c.state].filter(Boolean).join(", ") || "—";
                    return (
                      <TableRow key={c.id} data-testid={`customer-row-${c.id}`}>
                        <TableCell className="font-medium text-slate-900">
                          {c.full_name}
                        </TableCell>
                        <TableCell className="text-slate-700">{c.email}</TableCell>
                        <TableCell className="text-slate-700">{c.phone_number}</TableCell>
                        <TableCell
                          className="max-w-[220px] truncate text-slate-700"
                          title={fullAddress || "—"}
                          data-testid={`customer-address-${c.id}`}
                        >
                          {compact}
                          {c.postal_code ? (
                            <span className="ml-1 text-xs text-slate-500">
                              · {c.postal_code}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className="text-slate-700"
                          data-testid={`customer-created-${c.id}`}
                        >
                          {c.created_at ? formatDate(c.created_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(c)}
                              data-testid={`edit-customer-${c.id}`}
                              aria-label="Edit customer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteTarget(c)}
                              data-testid={`delete-customer-${c.id}`}
                              aria-label="Delete customer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="customer-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the customer details below."
                : "Enter the customer details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                data-testid="input-customer-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              {errors.full_name && (
                <p className="text-xs text-red-600" data-testid="err-customer-name">
                  {errors.full_name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-customer-email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && (
                  <p className="text-xs text-red-600" data-testid="err-customer-email">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  data-testid="input-customer-phone"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="+91 98765 43210"
                />
                {errors.phone_number && (
                  <p className="text-xs text-red-600" data-testid="err-customer-phone">
                    {errors.phone_number}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-medium text-slate-900">Address</h3>
              <p className="mt-1 text-xs text-slate-500">
                Used for shipping &amp; billing in future orders.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                data-testid="input-customer-addr1"
                value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                placeholder="House / Flat / Building, Street"
              />
              {errors.address_line1 && (
                <p className="text-xs text-red-600" data-testid="err-customer-addr1">
                  {errors.address_line1}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">
                Address Line 2 <span className="text-xs text-slate-400">(optional)</span>
              </Label>
              <Input
                id="address_line2"
                data-testid="input-customer-addr2"
                value={form.address_line2}
                onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                placeholder="Area, Landmark"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  data-testid="input-customer-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                {errors.city && (
                  <p className="text-xs text-red-600" data-testid="err-customer-city">
                    {errors.city}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  data-testid="input-customer-state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
                {errors.state && (
                  <p className="text-xs text-red-600" data-testid="err-customer-state">
                    {errors.state}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal / PIN Code</Label>
                <Input
                  id="postal_code"
                  data-testid="input-customer-postal"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="560001"
                />
                {errors.postal_code && (
                  <p className="text-xs text-red-600" data-testid="err-customer-postal">
                    {errors.postal_code}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="cancel-customer-btn"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} data-testid="submit-customer-btn">
                {submitting
                  ? "Saving..."
                  : editing
                    ? "Update Customer"
                    : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="delete-customer-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  This will permanently remove{" "}
                  <span className="font-medium text-slate-900">{deleteTarget.full_name}</span>{" "}
                  ({deleteTarget.email}). Customers with existing orders cannot be deleted.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-customer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-customer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
