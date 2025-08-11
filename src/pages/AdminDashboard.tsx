import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Label from "../components/ui/Label";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { listPendingProviders, approveProvider, rejectProvider } from "../api/admin";
import type { ProviderLite } from "../api/admin";
import { Check, X, RefreshCw, Shield, Search, ChevronLeft, ChevronRight } from "lucide-react";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join("");
}
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

export default function AdminDashboard() {
  const [rows, setRows] = useState<ProviderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // server-side search + pagination
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(opts?: { resetPage?: boolean }) {
    setLoading(true); setErr(null); setMsg(null);
    try {
      const effectivePage = opts?.resetPage ? 1 : page;
      const res = await listPendingProviders({ q, page: effectivePage, limit });
      setRows(res.items);
      setPage(res.page);
      setTotal(res.total);
      setHasMore(res.hasMore);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }

  // initial + on page change
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, limit]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => load({ resetPage: true }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function afterActionRemove(id: string) {
    setRows(prev => prev.filter(p => p.id !== id));
    setTotal(t => Math.max(0, t - 1));
  }

  async function onApprove(id: string) {
    const notes = window.prompt("Notes (optional):") ?? undefined;
    setBusyId(id); setErr(null); setMsg(null);
    try {
      await approveProvider(id, notes);
      afterActionRemove(id);
      setMsg("KYC approved");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Approval failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string) {
    const reason = window.prompt("Reason (optional):") ?? undefined;
    if (reason === null) return; // user hit cancel
    setBusyId(id); setErr(null); setMsg(null);
    try {
      await rejectProvider(id, reason);
      afterActionRemove(id);
      setMsg("KYC rejected");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Rejection failed");
    } finally {
      setBusyId(null);
    }
  }

  const subtitle = useMemo(() => {
    const showingFrom = rows.length ? (page - 1) * limit + 1 : 0;
    const showingTo = (page - 1) * limit + rows.length;
    return `Showing ${showingFrom}-${showingTo} of ${total}`;
  }, [rows.length, page, limit, total]);

  return (
    <div className="container py-8 space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">KYC Console</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search providers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 w-64"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <Button variant="secondary" onClick={() => load()}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {msg && <div className="rounded-lg border border-green-300 bg-green-50 text-green-700 p-2 text-sm">{msg}</div>}
      {err && <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{err}</div>}

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600">
            Pending providers <Badge tone="yellow" className="ml-2">{total}</Badge>
          </div>
          <Pager page={page} hasMore={hasMore} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
        </div>

        {/* Header (desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-slate-500">
          <div className="col-span-4">Provider</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Country</div>
          <div className="col-span-2">Submitted</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        <ul className="divide-y">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-3 py-3">
                <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200/70" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200/70" />
              </li>
            ))
          ) : rows.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-slate-600">
              <Shield className="mx-auto mb-2 text-slate-400" />
              No pending providers.
            </li>
          ) : (
            rows.map(p => (
              <li key={p.id} className="px-3 py-3">
                <div className="grid md:grid-cols-12 gap-3 items-center">
                  {/* Provider */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white grid place-items-center text-xs">
                      {initials(p.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      {p.orgName && <div className="text-xs text-slate-500">{p.orgName}</div>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-3 text-sm text-slate-700 break-all">{p.email}</div>

                  {/* Country */}
                  <div className="md:col-span-2 text-sm text-slate-700">{p.country || "—"}</div>

                  {/* Submitted */}
                  <div className="md:col-span-2 text-sm text-slate-700">{fmtDate(p.submittedAt)}</div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex justify-end gap-2">
                    <Button size="sm" disabled={busyId === p.id} onClick={() => onApprove(p.id)}>
                      <Check size={16} className="mr-1" /> <span className="hidden sm:inline">Approve</span><span className="sm:hidden">OK</span>
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busyId === p.id} onClick={() => onReject(p.id)}>
                      <X size={16} className="mr-1" /> <span className="hidden sm:inline">Reject</span><span className="sm:hidden">No</span>
                    </Button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Bottom pager (mobile) */}
        <div className="md:hidden border-t px-3 py-2">
          <Pager page={page} hasMore={hasMore} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
        </div>
      </Card>

      {/* Manual action by ID */}
      <Card className="max-w-xl">
        <h2 className="text-base font-semibold mb-2">Manual action by ID</h2>
        <p className="text-sm text-slate-600 mb-3">If needed, paste a provider’s Mongo ID and approve/reject.</p>
        <div className="grid sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pid">Provider ID</Label>
            <Input id="pid" placeholder="64c9…e2f" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => {
              const el = document.getElementById("pid") as HTMLInputElement | null;
              if (!el?.value) return;
              onApprove(el.value.trim());
              el.value = "";
            }}>Approve</Button>
            <Button variant="secondary" onClick={() => {
              const el = document.getElementById("pid") as HTMLInputElement | null;
              if (!el?.value) return;
              onReject(el.value.trim());
              el.value = "";
            }}>Reject</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Pager({ page, hasMore, onPrev, onNext }: { page: number; hasMore: boolean; onPrev: () => void; onNext: () => void; }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={onPrev} disabled={page <= 1}>
        <ChevronLeft size={16} className="mr-1" /> Prev
      </Button>
      <span className="text-xs text-slate-500">Page {page}</span>
      <Button variant="secondary" size="sm" onClick={onNext} disabled={!hasMore}>
        Next <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
}
