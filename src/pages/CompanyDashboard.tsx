// src/pages/CompanyDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import type { CreateRequestBody, InsuranceRequest, Asset } from "../type";
import { docId } from "../type";
import { createRequest, getMyRequests } from "../api/company";
import Card from "../components/ui/Card";
import Label from "../components/ui/Label";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";

export default function CompanyDashboard() {
  const [items, setItems] = useState<InsuranceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getMyRequests();
      setItems(data);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insurance Requests</h1>
          <p className="text-sm text-slate-500">Create placements, track status, and manage documents.</p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="sm:self-auto">+ New Request</Button>
      </header>

      <StatsBar items={items} loading={loading} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My requests</h2>
        </div>

        {err && <div className="mb-3 rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{err}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><div className="h-28 animate-pulse bg-slate-100 rounded" /></Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState onNew={() => setOpenModal(true)} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <li key={docId(r)}>
                <Link to={`/requests/${docId(r)}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{r.title}</div>
                      <StatusBadge status={r.status} />
                    </div>

                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.summary || "—"}</p>

                    <div className="mt-3 space-y-1">
                      <InfoRow label="Target coverage" value={`${r.targetCoverage}%`} />
                      {"asset" in r && r.asset?.sumInsured != null && (
                        <InfoRow
                          label="Sum insured"
                          value={formatMoney(r.asset.sumInsured, r.asset.currency || "USD")}
                        />
                      )}
                      {r.deadline && <InfoRow label="Deadline" value={formatDateTime(r.deadline)} />}
                    </div>

                    {"asset" in r && r.asset?.location?.country && (
                      <div className="mt-3 text-xs text-slate-500">
                        {r.asset.location.city ? `${r.asset.location.city}, ` : ""}
                        {r.asset.location.country}
                      </div>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {openModal && (
        <RequestModal
          onClose={() => setOpenModal(false)}
          onCreated={() => { setOpenModal(false); load(); }}
        />
      )}
    </div>
  );
}

/* ---------- Modal ---------- */
function RequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateRequestBody>({
    title: "",
    summary: "",
    targetCoverage: 100,
    deadline: "",
    asset: {
      description: "",
      sumInsured: 0,
      currency: "USD",
      location: { country: "", city: "" },
      riskDetails: "",
      attachments: []
    }
  });
  const [deadlineLocal, setDeadlineLocal] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // typed setters
  const setField = <K extends keyof CreateRequestBody>(key: K, v: CreateRequestBody[K]) =>
    setForm((f) => ({ ...f, [key]: v }));
  const setAssetField = <K extends keyof Asset>(key: K, v: Asset[K]) =>
    setForm((f) => ({ ...f, asset: { ...f.asset, [key]: v } }));
  const setLoc = (k: "country" | "city", v: string) =>
    setForm((f) => ({ ...f, asset: { ...f.asset, location: { ...(f.asset.location || {}), [k]: v } } }));

  // date min = tomorrow
  const minDeadlineDate = useMemo(() => toLocalDateInput(new Date(Date.now() + 24 * 3600 * 1000)), []);

  // esc to close + lock background scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true); setErr(null);
    try {
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.asset?.description?.trim()) throw new Error("Asset description is required");
      const sum = Number(form.asset?.sumInsured);
      if (!Number.isFinite(sum) || sum <= 0) throw new Error("Sum insured must be greater than 0");
      const tc = Number(form.targetCoverage ?? 100);
      if (!Number.isFinite(tc) || tc < 1 || tc > 100) throw new Error("Target coverage must be between 1 and 100");
      if (!deadlineLocal) throw new Error("Deadline date is required");

      const isoDeadline = endOfDayISOFromLocalDate(deadlineLocal);
      if (new Date(isoDeadline).getTime() <= Date.now()) throw new Error("Deadline must be a future date");

      await createRequest({
        title: form.title.trim(),
        summary: form.summary?.trim() || "",
        targetCoverage: tc,
        deadline: isoDeadline,
        asset: {
          description: form.asset!.description.trim(),
          sumInsured: sum,
          currency: (form.asset?.currency || "USD").toUpperCase(),
          location: {
            country: form.asset?.location?.country?.trim() || undefined,
            city: form.asset?.location?.city?.trim() || undefined
          },
          riskDetails: form.asset?.riskDetails?.trim() || undefined
        }
      });

      onCreated();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Create failed");
    } finally {
      setPending(false);
    }
  }

  const currencyOptions = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD", "AED"];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="new-request-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Container: mobile sheet (bottom) + desktop centered card */}
      <div className="relative z-10 flex min-h-[100svh] items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="w-full sm:max-w-3xl max-h-[100svh] sm:max-h-[85vh] bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">IR</div>
              <div>
                <h3 id="new-request-title" className="text-base sm:text-xl font-semibold leading-tight">New insurance request</h3>
                <p className="text-xs text-slate-500">Describe your asset and set a bidding deadline.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-md text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Scrollable form body */}
          <form onSubmit={submit} className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {err && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{err}</div>}

              {/* Basics */}
              <Section title="Basics">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Plant & Machinery Cover" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Summary</Label>
                    <Input value={form.summary} onChange={(e) => setField("summary", e.target.value)} placeholder="Heavy equipment across 3 sites" />
                  </div>
                  <div>
                    <Label>Target Coverage (%)</Label>
                    <Input type="number" min={1} max={100} inputMode="numeric" value={form.targetCoverage ?? 100}
                      onChange={(e) => setField("targetCoverage", Number(e.target.value))} required />
                    <p className="mt-1 text-xs text-slate-500">Total allocation must equal this at finalize.</p>
                  </div>
                  <div>
                    <Label>Deadline (date)</Label>
                    <input
                      type="date"
                      min={minDeadlineDate}
                      value={deadlineLocal}
                      onChange={(e) => setDeadlineLocal(e.target.value)}
                      className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">Bidding closes at the end of the selected day.</p>
                  </div>
                </div>
              </Section>

              {/* Asset */}
              <Section title="Asset">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <textarea
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      rows={3}
                      placeholder="Mining plant & machinery, 12 excavators, 5 haul trucks"
                      value={form.asset.description}
                      onChange={(e) => setAssetField("description", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Sum Insured</Label>
                    <Input
                      type="number"
                      min={1}
                      step="1"
                      inputMode="numeric"
                      value={form.asset.sumInsured ? String(form.asset.sumInsured) : ""}
                      onChange={(e) => setAssetField("sumInsured", Number(e.target.value || "0"))}
                      placeholder="100000000"
                      required
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <select
                      value={(form.asset.currency || "USD").toUpperCase()}
                      onChange={(e) => setAssetField("currency", e.target.value.toUpperCase())}
                      className="block w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      {currencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </Section>

              {/* Location & Risk */}
              <Section title="Location & Risk">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Country (optional)</Label>
                    <Input value={form.asset.location?.country || ""} onChange={(e) => setLoc("country", e.target.value)} placeholder="US" />
                  </div>
                  <div>
                    <Label>City (optional)</Label>
                    <Input value={form.asset.location?.city || ""} onChange={(e) => setLoc("city", e.target.value)} placeholder="Elko" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Risk Details (optional)</Label>
                    <textarea
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      rows={2}
                      placeholder="High wildfire exposure; sprinklers installed 2024"
                      value={form.asset.riskDetails || ""}
                      onChange={(e) => setAssetField("riskDetails", e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* Actions (NOT fixed) */}
              <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={onClose}
                  className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button disabled={pending}>{pending ? "Creating…" : "Create request"}</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




/* ---------- Bits & bobs ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-px w-4 bg-indigo-200" />
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: InsuranceRequest["status"] }) {
  const styles: Record<InsuranceRequest["status"], string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    consortium_formed: "bg-amber-50 text-amber-700 border-amber-200",
    finalized: "bg-blue-50 text-blue-700 border-blue-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return <span className={`ml-2 rounded border px-2 py-0.5 text-xs ${styles[status]}`}>{status}</span>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center text-center py-12">
      <div className="mb-2 text-lg font-medium">No requests yet</div>
      <p className="max-w-md text-sm text-slate-500">
        Create your first insurance request to start receiving bids from verified providers.
      </p>
      <Button onClick={onNew} className="mt-4">+ New Request</Button>
    </Card>
  );
}

function StatsBar({ items, loading }: { items: InsuranceRequest[]; loading: boolean }) {
  if (loading) return (
    <div className="grid gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <Card key={i}><div className="h-16 animate-pulse bg-slate-100 rounded" /></Card>)}
    </div>
  );
  const total = items.length;
  const open = items.filter(i => i.status === "open").length;
  const formed = items.filter(i => i.status === "consortium_formed").length;
  const finalized = items.filter(i => i.status === "finalized").length;
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Stat label="Total" value={String(total)} />
      <Stat label="Open" value={String(open)} />
      <Stat label="Consortium formed" value={String(formed)} />
      <Stat label="Finalized" value={String(finalized)} />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </Card>
  );
}

function formatMoney(amount: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}
function formatDateTime(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}
function toLocalDateTimeInput(date?: Date) {
  if (!date) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function toLocalDateInput(date?: Date) {
  if (!date) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function endOfDayISOFromLocalDate(yyyyMmDd: string) {
  // build a Date in local time at 23:59:59.999, then convert to ISO
  const [y, m, d] = yyyyMmDd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
  return dt.toISOString();
}