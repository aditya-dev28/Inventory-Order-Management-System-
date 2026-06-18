import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Boxes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { DEMO_CREDENTIALS, isAuthenticated, login } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, send straight to the dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate a quick auth call for nicer UX
    setTimeout(() => {
      login(email.trim().toLowerCase());
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    }, 350);
  };

  const useDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="login-page">
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
              <Boxes className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Inventory &amp; Order Management System
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access your admin console.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.in"
                    data-testid="login-email"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600" data-testid="err-login-email">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    data-testid="login-password"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600" data-testid="err-login-password">
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                  data-testid="login-submit"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-5 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-700">Demo credentials</div>
                    <div className="mt-0.5 font-mono">
                      {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={useDemo}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    data-testid="use-demo-credentials"
                  >
                    Use demo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500">
            v1.0 · Inventory &amp; Orders
          </p>
        </div>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
