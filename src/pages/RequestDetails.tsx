import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Progress from "../components/ui/Progress";
import type { Bid, InsuranceRequest, Consortium } from "../type";
import {
  getRequest,
  getRequestBids,
  createConsortium,
  finalizeConsortium,
  getConsortium,
} from "../api/requests";
import { Shield, RefreshCw, CheckCircle2, ChevronLeft } from "lucide-react";

export default function RequestDetails() {
  const { id = "" } = useParams();
  const { user } = useAuth();

  const [req, setReq] = useState<InsuranceRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [consortium, setConsortium] = useState<Consortium | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const target = req?.targetCoverage ?? 100;

  const totalSelectedCoverage = useMemo(
    () =>
      bids
        .filter((b) => selected.includes(b.id ?? b._id!))
        .reduce((s, b) => s + (b.coveragePercent || 0), 0),
    [bids, selected]
  );

  const exactMatch = totalSelectedCoverage === target;
  const overTarget = totalSelectedCoverage > target;
  const canEdit =
    user?.role === "company" && !(consortium?.isLocked || req?.status === "finalized");

  async function loadAll() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await getRequest(id);
      setReq(r);

      // bids (owner/admin only; otherwise ignore)
      let bs: Bid[] = [];
      try {
        bs = await getRequestBids(id);
      } catch {
        bs = [];
      }
      setBids(bs);

      // consortium + preselect
      try {
        const c = await getConsortium(id);
        setConsortium(c || null);
        if (c?.entries?.length) setSelected(c.entries.map((e) => e.bidId));
        else setSelected([]);
      } catch {
        setConsortium(null);
        setSelected([]);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to load request");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onCreateConsortium() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await createConsortium(id, selected);
      setMsg("Consortium saved");
      await loadAll();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Consortium save failed");
    } finally {
      setBusy(false);
    }
  }
  async function onFinalize() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await finalizeConsortium(id);
      setMsg("Contract finalized");
      await loadAll();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Finalize failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container px-3 sm:px-4 py-8 text-sm text-slate-600">Loading…</div>;

  if (err) {
    return (
      <div className="container px-3 sm:px-4 py-8 space-y-4">
        <Card className="p-4 sm:p-5">
          <div className="text-sm text-red-700">{err}</div>
          <div className="mt-3 flex gap-2">
            <Button onClick={loadAll}>Retry</Button>
            <Link to="/company">
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!req) return null;

  const statusTone: "blue" | "yellow" | "green" | "gray" =
    req.status === "open" ? "blue" :
    req.status === "consortium_formed" ? "yellow" :
    req.status === "finalized" ? "green" : "gray";

  const currency = req.asset?.currency || "USD";

  return (
    <div className="container max-w-5xl px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white grid place-items-center shadow">
              <Shield size={18} className="sm:hidden" />
              <Shield size={20} className="hidden sm:block" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">{req.title}</h1>
              <p className="text-[13px] sm:text-sm text-slate-600 mt-1">{req.summary || "—"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge tone={statusTone}>{req.status}</Badge>
                <Badge tone="purple">Target {target}%</Badge>
                {req.asset?.sumInsured != null && (
                  <Badge tone="blue">{formatMoney(req.asset.sumInsured, currency)}</Badge>
                )}
                {req.deadline && <Badge tone="gray">Deadline {formatDate(req.deadline)}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/company" className="hidden sm:inline-flex">
              <Button variant="secondary" size="sm">
                <ChevronLeft className="mr-2" size={16} />
                Back
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={loadAll}>
              <RefreshCw className="mr-2" size={16} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* PROGRESS */}
      {user?.role === "company" && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              Selected coverage total: <strong>{totalSelectedCoverage}%</strong>
              {overTarget && <span className="ml-2 text-red-600">• Over target</span>}
              {exactMatch && <span className="ml-2 text-emerald-600">• Exact match</span>}
            </div>
            <div className="w-full sm:w-[26rem]">
              <Progress value={totalSelectedCoverage} max={target} />
            </div>
          </div>
        </Card>
      )}

      {/* BIDS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold">Bids</h2>
        </div>

        {msg && (
          <div className="mb-3 rounded-lg border border-green-300 bg-green-50 text-green-700 p-2 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} /> {msg}
          </div>
        )}

        {bids.length === 0 ? (
          <div className="rounded-2xl border bg-white/70 p-8 text-center">
            <Shield className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600">No bids yet. Check back soon.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bids.map((b) => {
              const bidId = b.id ?? b._id!;
              const isSelected = selected.includes(bidId);
              const name = b.provider?.name ?? "Provider";
              const org = b.provider?.orgName;
              const kyc = b.provider?.kycStatus;
              const kycTone: "green" | "red" | "yellow" | "blue" | "gray" | "purple" =
                kyc === "verified" ? "green" : kyc === "rejected" ? "red" : "yellow";
              const initials = name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <li key={bidId}>
                  <Card className="p-4 sm:p-5">
                    {/* Provider header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-900/80 text-white grid place-items-center text-[11px] sm:text-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{name}</div>
                          {org && <div className="text-[12px] sm:text-xs text-slate-500">{org}</div>}
                        </div>
                      </div>
                      {kyc && <Badge tone={kycTone} className="whitespace-nowrap">KYC {kyc}</Badge>}
                    </div>

                    {/* Bid body */}
                    <div className="font-medium">{b.coveragePercent}% coverage</div>
                    <div className="text-sm text-slate-600">
                      Premium: {formatMoney(b.premium, b.premiumCurrency || currency)}
                    </div>
                    {b.terms && <div className="text-[12px] sm:text-xs text-slate-500 mt-1">{b.terms}</div>}

                    {/* selection */}
                    {canEdit && (
                      <label className="mt-3 inline-flex items-center gap-2 text-sm select-none cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={isSelected}
                          onChange={(e) => {
                            const next = new Set(selected);
                            e.target.checked ? next.add(bidId) : next.delete(bidId);
                            setSelected([...next]);
                          }}
                        />
                        <span
                          className={`rounded px-2 py-0.5 transition ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          Select
                        </span>
                      </label>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {/* STICKY ACTIONS */}
        {user?.role === "company" && bids.length > 0 && (
          <div className="sticky bottom-0 sm:bottom-4 mt-4">
            <Card className="rounded-none sm:rounded-2xl border-t sm:border shadow-none sm:shadow-md backdrop-blur bg-white/95 sm:bg-white/90 pb-[max(env(safe-area-inset-bottom),0px)]">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
                <div className="text-sm text-slate-700">
                  Selected: <strong>{totalSelectedCoverage}%</strong>
                  <span className="ml-2 text-slate-500">Target: {target}%</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!consortium?.isLocked && (
                    <Button
                      onClick={onCreateConsortium}
                      disabled={busy || selected.length === 0 || overTarget}
                      title={overTarget ? "Selection exceeds target" : undefined}
                    >
                      {busy ? "Working…" : "Save selection"}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={loadAll}>
                    <RefreshCw className="mr-2" size={16} />
                    Refresh
                  </Button>
                  {!consortium?.isLocked ? (
                    <Button
                      variant="secondary"
                      onClick={onFinalize}
                      disabled={busy || !exactMatch}
                      title={!exactMatch ? "Total coverage must equal target to finalize" : undefined}
                    >
                      {busy ? "Finalizing…" : "Finalize contract"}
                    </Button>
                  ) : (
                    <Badge tone="green">Finalized</Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

/* helpers */
function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
