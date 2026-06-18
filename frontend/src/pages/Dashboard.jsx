import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import api, { extractError } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function StatCard({ title, value, icon: Icon, accent, hint, testId, to }) {
  const content = (
    <Card className="transition-shadow hover:shadow-md" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get("/dashboard/stats")
      .then((res) => mounted && setStats(res.data))
      .catch((err) => toast.error(extractError(err, "Failed to load dashboard")))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Overview of inventory, customers and order activity.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Products"
            value={stats?.total_products ?? 0}
            icon={Package}
            accent="bg-blue-600"
            testId="stat-total-products"
            to="/products"
          />
          <StatCard
            title="Total Customers"
            value={stats?.total_customers ?? 0}
            icon={Users}
            accent="bg-slate-700"
            testId="stat-total-customers"
            to="/customers"
          />
          <StatCard
            title="Total Orders"
            value={stats?.total_orders ?? 0}
            icon={ShoppingCart}
            accent="bg-emerald-600"
            testId="stat-total-orders"
            to="/orders"
          />
          <StatCard
            title="Low Stock Products"
            value={stats?.low_stock_products ?? 0}
            icon={AlertTriangle}
            accent="bg-amber-500"
            hint={`Threshold: ≤ ${stats?.low_stock_threshold ?? 10} units`}
            testId="stat-low-stock"
            to="/products"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            to="/products"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            data-testid="quick-action-products"
          >
            Manage Products
          </Link>
          <Link
            to="/customers"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            data-testid="quick-action-customers"
          >
            Manage Customers
          </Link>
          <Link
            to="/orders/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            data-testid="quick-action-new-order"
          >
            Create New Order
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
