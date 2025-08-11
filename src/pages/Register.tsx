import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../type";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Card from "../components/ui/Card";
import { routeForRole } from "../lib/routeForRole";
import { Eye, EyeOff, Building2, User as UserIcon } from "lucide-react";

export default function Register() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("company");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ [k: string]: string }>({});

  const isOrgRequired = role === "company" || role === "provider";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    const em = email.trim().toLowerCase();
    if (!em) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(em)) errs.email = "Enter a valid email";
    if (!password || password.length < 8) errs.password = "Minimum 8 characters";
    if (isOrgRequired && !orgName.trim()) errs.org = "Organization is required";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setError(null);
    try {
      if (!validate()) return;
      const user = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        orgName: isOrgRequired ? orgName.trim() : undefined,
      });
      setUser(user);                 // token already persisted by lib/auth
      nav(routeForRole(user.role));  // go straight to dashboard
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-[100svh]">
      {/* background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-indigo-200 blur-3xl opacity-40"></div>
        <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet-200 blur-3xl opacity-40"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 items-center min-h-[100svh] gap-8 py-10">
          {/* Left copy (hidden on small) */}
          <div className="hidden md:block">
            <h1 className="text-4xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-3 text-slate-600 max-w-md">Choose your role to get the right tools and permissions.</p>
            <ul className="mt-6 space-y-2 text-slate-700 text-sm">
              <li>• Companies post assets and finalize consortiums</li>
              <li>• Providers bid, collaborate, and manage awards</li>
            </ul>
          </div>

          {/* Auth card */}
          <Card className="w-full max-w-md md:ml-auto md:mr-0 mx-auto">
            <h2 className="text-xl font-semibold">Create account</h2>
            {error && <div className="mt-3 rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{error}</div>}
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              {/* Role segmented control */}
              <div>
                <Label>Role</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("company")}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      role === "company" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white"
                    }`}
                  >
                    <Building2 size={16} /> Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("provider")}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      role === "provider" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white"
                    }`}
                  >
                    <UserIcon size={16} /> Provider
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">Admin accounts are created by an administrator.</p>
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fieldErr.name} required />
                {fieldErr.name && <p className="mt-1 text-xs text-red-600">{fieldErr.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!fieldErr.email}
                  required
                />
                {fieldErr.email && <p className="mt-1 text-xs text-red-600">{fieldErr.email}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!fieldErr.password}
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
                <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
                {fieldErr.password && <p className="mt-1 text-xs text-red-600">{fieldErr.password}</p>}
              </div>

              <div>
                <Label htmlFor="org">Organization {isOrgRequired ? "(required)" : "(optional)"}</Label>
                <Input
                  id="org"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                  aria-invalid={!!fieldErr.org}
                  required={isOrgRequired}
                />
                {fieldErr.org && <p className="mt-1 text-xs text-red-600">{fieldErr.org}</p>}
              </div>

              <Button className="w-full" disabled={pending}>
                {pending ? "Creating…" : "Sign up"}
              </Button>
              <p className="text-center text-sm text-slate-600">
                Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
