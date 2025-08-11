import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Card from "../components/ui/Card";
import { routeForRole } from "../lib/routeForRole";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      const user = await login({ email: email.trim().toLowerCase(), password });
      setUser(user);
      nav(routeForRole(user.role));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-[100svh]">
      {/* decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-indigo-200 blur-3xl opacity-40"></div>
        <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet-200 blur-3xl opacity-40"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 items-center min-h-[100svh] gap-8 py-10">
          {/* left copy */}
          <div className="hidden md:block">
            <h1 className="text-4xl font-bold tracking-tight">Secure, modern insurance marketplace</h1>
            <p className="mt-3 text-slate-600 max-w-md">
              Bid, form consortiums, and finalize contracts—all in one place.
            </p>
            <ul className="mt-6 space-y-2 text-slate-700 text-sm">
              <li>• Role-based dashboards</li>
              <li>• KYC approvals</li>
              <li>• Clean, accessible UI</li>
            </ul>
          </div>

          {/* form card */}
          <Card className="w-full max-w-md md:ml-auto md:mr-0 mx-auto">
            <h2 className="text-xl font-semibold">Sign in</h2>
            {error && <div className="mt-3 rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{error}</div>}
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button className="w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
              <p className="text-center text-sm text-slate-600">
                New here? <Link to="/register" className="text-indigo-600 hover:underline">Create an account</Link>
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
