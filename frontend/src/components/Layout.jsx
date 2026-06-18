import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Menu,
  X,
  Boxes,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { getSession, logout as authLogout } from "@/lib/auth";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testId: "nav-dashboard" },
  { to: "/products", label: "Products", icon: Package, testId: "nav-products" },
  { to: "/customers", label: "Customers", icon: Users, testId: "nav-customers" },
  { to: "/orders", label: "Orders", icon: ShoppingCart, testId: "nav-orders" },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    authLogout();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">Inventory</div>
          <div className="text-xs text-slate-500">Order Management</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={testId}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-3 py-3">
        {session?.email && (
          <div className="mb-2 truncate px-2 text-xs text-slate-500" data-testid="logged-in-email">
            Signed in as <span className="font-medium text-slate-700">{session.email}</span>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
        <div className="mt-2 px-2 text-xs text-slate-400">v1.0 · Inventory &amp; Orders</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {SidebarContent}
      </aside>

      {/* Sidebar (mobile drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            data-testid="sidebar-backdrop"
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              data-testid="mobile-menu-toggle"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
              Inventory & Order Management
            </h1>
          </div>
          <div className="hidden text-sm text-slate-500 sm:block">Admin Console</div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
