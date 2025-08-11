import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Label from "../components/ui/Label";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import {
  getOpenRequests,
  placeBid,
  getMyBidForRequest,
  getMyAwards,
  getRequestCompany,
  type OpenReqQuery,
} from "../api/provider";
import type { InsuranceRequest } from "../type";
import type { Award, CompanyCard } from "../type";
import { docId } from "../type";
import { useAuth } from "../context/AuthContext";
import { resubmitKyc } from "../api/kyc";
import {
  AlertTriangle, Info, CheckCircle2, X,
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, Filter, RefreshCw
} from "lucide-react";

/* ---------- tiny utils ---------- */
type MyBid = { id?: string; _id?: string; requestId: string; coveragePercent: number; premium: number; terms?: string; status: "pending"|"accepted"|"rejected"; };
const toNum = (s: string) => { const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : undefined; };
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const fmtMoney = (amt: number, cur: string) => { try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(amt); } catch { return `${cur} ${amt.toLocaleString()}`; } };
const roundCurrency = (amt: number, cur: string) => { try { const d = new Intl.NumberFormat(undefined, { style:"currency", currency:cur }).resolvedOptions().minimumFractionDigits ?? 2; const f = 10 ** d; return Math.round(amt * f) / f; } catch { return Math.round(amt * 100) / 100; } };
const shallowEqual = (a: any, b: any) => { const ak = Object.keys(a), bk = Object.keys(b); if (ak.length !== bk.length) return false; for (const k of ak) if (a[k] !== b[k]) return false; return true; };

/* ---------- page ---------- */
export default function ProviderDashboard() {
  const { user, updateUser } = useAuth();

  // source of truth: all open requests fetched from server (once / on refresh)
  const [allOpen, setAllOpen] = useState<InsuranceRequest[]>([]);
  const [openLoading, setOpenLoading] = useState(true);
  const [openErr, setOpenErr] = useState<string | null>(null);

  // client-side paging
  const [page, setPage] = useState(1);
  const [limit] = useState(6);

  // filters (UI) + applied (used for client-side filtering)
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [minSum, setMinSum] = useState("");
  const [maxSum, setMaxSum] = useState("");
  const [sort, setSort] = useState<OpenReqQuery["sort"]>("new");
  const [applied, setApplied] = useState<OpenReqQuery>({ sort: "new" });

  // mobile filter drawer
  const [filtersOpen, setFiltersOpen] = useState(false);

  // bids map for visible slice
  const [myBids, setMyBids] = useState<Record<string, MyBid | null>>({});

  // awards (separate)
  const [awards, setAwards] = useState<Award[]>([]);
  const [awardsLoading, setAwardsLoading] = useState(true);
  const [awardsErr, setAwardsErr] = useState<string | null>(null);

  // company modal
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyCard | null>(null);
  const [companyErr, setCompanyErr] = useState<string | null>(null);
  const [companyTitle, setCompanyTitle] = useState("");

  const canBid = user?.kycStatus === "verified";
  const showRejected = user?.role === "provider" && user?.kycStatus === "rejected";
  const showPending  = user?.role === "provider" && user?.kycStatus === "pending";

  // KYC re-submit
  const [resubmitBusy, setResubmitBusy] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [bannerErr, setBannerErr] = useState<string | null>(null);

  async function onResubmit() {
    setResubmitBusy(true); setBannerErr(null); setBannerMsg(null);
    try {
      await resubmitKyc();
      updateUser({ kycStatus: "pending", kycResubmitCount: (user?.kycResubmitCount ?? 0) + 1 });
      setBannerMsg("Re-approval requested. Your KYC status is now pending.");
    } catch (e: any) {
      setBannerErr(e?.response?.data?.message ?? e?.message ?? "Could not request re-approval");
    } finally { setResubmitBusy(false); }
  }

  /* ---------- load all open requests once, then filter client-side ---------- */
  async function fetchAllOpen() {
    setOpenLoading(true); setOpenErr(null);
    try {
      const batch = 200; // biggish page to minimize loops
      let page = 1;
      let acc: InsuranceRequest[] = [];
      // loop until hasMore = false
      // (works even if backend ignores limit; we'll just stop when hasMore is false)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await getOpenRequests({ page, limit: batch });
        acc = acc.concat(res.items || []);
        if (!res.hasMore) break;
        page += 1;
      }
      setAllOpen(acc);
    } catch (e: any) {
      setOpenErr(e?.response?.data?.message ?? e?.message ?? "Failed to load open requests");
    } finally {
      setOpenLoading(false);
    }
  }

  async function loadAwards() {
    setAwardsLoading(true); setAwardsErr(null);
    try { setAwards(await getMyAwards()); }
    catch (e: any) { setAwardsErr(e?.response?.data?.message ?? e?.message ?? "Failed to load awarded deals"); }
    finally { setAwardsLoading(false); }
  }

  useEffect(() => { fetchAllOpen(); }, []);
  useEffect(() => { loadAwards(); }, []);

  /* ---------- client-side filtering, sorting, pagination ---------- */
  const filtered = useMemo(() => {
    const needle = (applied.q || "").toLowerCase();
    const ctry = (applied.country || "").toLowerCase();
    const min = typeof applied.minSum === "number" ? applied.minSum : undefined;
    const max = typeof applied.maxSum === "number" ? applied.maxSum : undefined;

    let arr = allOpen.filter((r) => {
      const sum = Number(r.asset?.sumInsured ?? 0);
      const rc = (r.asset?.location?.country || "").toLowerCase();

      if (needle) {
        const hay = `${r.title || ""} ${r.summary || ""} ${r.asset?.description || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (ctry && rc !== ctry) return false;
      if (min !== undefined && sum < min) return false;
      if (max !== undefined && sum > max) return false;
      return true;
    });

    switch (applied.sort) {
      case "sum_desc":
        arr.sort((a, b) => (Number(b.asset?.sumInsured ?? 0) - Number(a.asset?.sumInsured ?? 0)));
        break;
      case "deadline_asc":
        arr.sort((a, b) => {
          const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
          const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
          return da - db || (new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        });
        break;
      default: // "new"
        arr.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }

    return arr;
  }, [allOpen, applied]);

  const total = filtered.length;
  const hasMore = page * limit < total;
  const viewItems = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  // fetch "my bid" only for currently visible slice
  useEffect(() => {
    (async () => {
      const ids = viewItems.map(r => docId(r));
      const results = await Promise.all(ids.map(id => getMyBidForRequest(id).catch(() => null)));
      const map: Record<string, MyBid | null> = {};
      ids.forEach((id, i) => (map[id] = results[i] ?? null));
      setMyBids(map);
    })();
  }, [viewItems]);

  // Apply / Reset
  const pendingFilters: OpenReqQuery = {
    q: q.trim() || undefined,
    country: country.trim() || undefined,
    minSum: toNum(minSum),
    maxSum: toNum(maxSum),
    sort,
  };
  const dirty = !shallowEqual(applied, pendingFilters);

  function doApply() {
    setPage(1);
    setApplied(pendingFilters);
    setFiltersOpen(false);
  }
  function onReset() {
    setQ(""); setCountry(""); setMinSum(""); setMaxSum(""); setSort("new");
    setPage(1); setApplied({ sort: "new" });
  }

  const subtitle = useMemo(() => {
    const from = viewItems.length ? (page - 1) * limit + 1 : 0;
    const to = (page - 1) * limit + viewItems.length;
    return `Showing ${from}-${to} of ${total}`;
  }, [viewItems.length, page, limit, total]);

  // const canBidTextTitle = "Bidding is available after KYC approval";

  return (
    <div className="container py-8 space-y-8">
      {/* header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Provider workspace</h1>
        {/* mobile filters button */}
        <Button className="sm:hidden" variant="secondary" size="sm" onClick={() => setFiltersOpen(true)}>
          <Filter size={16} className="mr-2" /> Filters
        </Button>
      </div>

      {/* KYC banners */}
      {showRejected && (
        <Card className="border-red-200 bg-red-50/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle size={18} />
              <div>Your KYC was <strong>rejected</strong>. You may request re-approval once.</div>
            </div>
            <Button onClick={onResubmit} disabled={resubmitBusy || (user?.kycResubmitCount ?? 0) >= 1}>
              {resubmitBusy ? "Requesting…" : "Request re-approval"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-red-700/80">
            {(user?.kycResubmitCount ?? 0) >= 1 ? "You have already requested re-approval. Please contact admin." : "This action is available only once."}
          </div>
          {bannerMsg && <div className="mt-3 rounded-lg border border-green-300 bg-green-50 text-green-700 p-2 text-xs flex items-center gap-2"><CheckCircle2 size={14} /> {bannerMsg}</div>}
          {bannerErr && <div className="mt-3 rounded-lg border border-red-300 bg-red-100 text-red-700 p-2 text-xs">{bannerErr}</div>}
        </Card>
      )}
      {showPending && (
        <Card className="border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <Info size={18} />
            <div>Your KYC is <strong>pending</strong>. You can place bids after approval.</div>
          </div>
        </Card>
      )}

      {/* Filter bar (desktop/tablet) */}
      <div className="hidden sm:block">
        <FilterForm
          q={q} setQ={setQ}
          country={country} setCountry={setCountry}
          minSum={minSum} setMinSum={setMinSum}
          maxSum={maxSum} setMaxSum={setMaxSum}
          sort={sort} setSort={setSort}
          dirty={dirty} onApply={doApply} onReset={onReset}
          subtitle={subtitle}
        />
      </div>

      {/* Open requests (client-side filtered) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Open requests</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchAllOpen}><RefreshCw size={16} className="mr-1" /> Refresh</Button>
            <Pager page={page} hasMore={hasMore} onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => p + 1)} />
          </div>
        </div>

        {openErr && <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{openErr}</div>}
        {openLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : viewItems.length === 0 ? (
          <div className="rounded-xl border bg-white/70 p-6 text-sm text-slate-600">No open requests.</div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {viewItems.map((r) => {
              const id = docId(r);
              const my = myBids[id] || null;
              return (
                <RequestCard
                  key={id}
                  item={r}
                  onBidPlaced={fetchAllOpen}
                  canBid={canBid}
                  myBid={my}
                  onSeeCompany={async () => {
                    setCompanyOpen(true);
                    setCompanyLoading(true);
                    setCompanyErr(null);
                    setCompanyInfo(null);
                    setCompanyTitle(r.title);
                    try { setCompanyInfo(await getRequestCompany(id)); }
                    catch (e: any) { setCompanyErr(e?.response?.data?.message ?? e?.message ?? "Could not fetch company details"); }
                    finally { setCompanyLoading(false); }
                  }}
                />
              );
            })}
          </ul>
        )}
      </section>

      {/* Awarded deals */}
      {user?.role === "provider" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Awarded deals</h2>
            <Button variant="secondary" size="sm" onClick={loadAwards}><RefreshCw size={16} className="mr-1" /> Refresh</Button>
          </div>

          {awardsErr && <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{awardsErr}</div>}
          {awardsLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : awards.length === 0 ? (
            <div className="rounded-xl border bg-white/70 p-6 text-sm text-slate-600">No awarded deals yet.</div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {awards.map(({ request, company }) => (
                <li key={request.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{request.title}</div>
                        <p className="text-sm text-slate-600 mt-1">{request.summary || "—"}</p>
                        <div className="text-xs text-slate-500 mt-2">
                          Target: {request.targetCoverage}% • Status: {request.status}
                        </div>
                        {company && (
                          <div className="mt-3 text-xs text-slate-700">
                            <div className="font-medium">Company</div>
                            <div>{company.name}{company.orgName ? ` — ${company.orgName}` : ""}</div>
                            <div className="text-slate-500">{company.email || "—"}</div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCompanyOpen(true);
                          setCompanyLoading(true);
                          setCompanyErr(null);
                          setCompanyInfo(null);
                          setCompanyTitle(request.title);
                          getRequestCompany(request.id!)
                            .then(setCompanyInfo)
                            .catch((e) => setCompanyErr(e?.response?.data?.message ?? e?.message ?? "Could not fetch company details"))
                            .finally(() => setCompanyLoading(false));
                        }}
                      >
                        Contact
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Company Modal */}
      <CompanyModal open={companyOpen} onClose={() => setCompanyOpen(false)} title={companyTitle} company={companyInfo} loading={companyLoading} error={companyErr} />

      {/* Mobile Filters Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="mt-3 space-y-3">
              <div className="relative">
                <Label>Search</Label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, summary, asset…" className="pl-8" />
                <Search size={16} className="absolute left-2 bottom-2.5 text-slate-400" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min budget</Label>
                  <Input type="number" min={0} value={minSum} onChange={(e) => setMinSum(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Max budget</Label>
                  <Input type="number" min={0} value={maxSum} onChange={(e) => setMaxSum(e.target.value)} placeholder="20000000" />
                </div>
              </div>
              <div>
                <Label>Sort</Label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="new">Newest</option>
                  <option value="sum_desc">Budget (high → low)</option>
                  <option value="deadline_asc">Deadline (soonest)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" onClick={onReset}><SlidersHorizontal size={16} className="mr-2" /> Reset</Button>
              <Button onClick={doApply} disabled={!dirty}><Filter size={16} className="mr-2" /> Apply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- desktop/tablet filter form ---------- */


/* ---------- Request card ---------- */
function RequestCard({
  item, onBidPlaced, canBid, myBid, onSeeCompany,
}: { item: InsuranceRequest; onBidPlaced: () => void; canBid: boolean; myBid: MyBid | null; onSeeCompany: () => void; }) {
  const [open, setOpen] = useState(false);
  const [coveragePercent, setCoveragePercent] = useState<number>(25);
  const [premium, setPremium] = useState<number>(0);
  const [terms, setTerms] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const id = docId(item);
  const hasBid = !!myBid;
  const accepted = myBid?.status === "accepted";

  const sumInsured = Number(item.asset?.sumInsured ?? 0);
  const currency = (item.asset?.currency || "USD").toUpperCase();
  const target = item.targetCoverage ?? 100;

  const onePercentAmount = sumInsured / 100;
  const coverageAmount = roundCurrency((sumInsured * (Number(coveragePercent) || 0)) / 100, currency);
  const pctValid = Number.isFinite(coveragePercent) && coveragePercent >= 1 && coveragePercent <= 100;

  function onChangePercent(v: number) {
    const pct = clamp(Math.round(v * 100) / 100, 1, 100);
    setCoveragePercent(pct);
    setPremium(roundCurrency((sumInsured * pct) / 100, currency));
  }
  function onChangePremium(v: number) {
    const amount = Math.max(0, v);
    setPremium(amount);
    if (sumInsured > 0) {
      const pct = clamp((amount / sumInsured) * 100, 1, 100);
      setCoveragePercent(Math.round(pct * 100) / 100);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (!pctValid) throw new Error("Coverage % must be between 1 and 100");
      await placeBid(id, { coveragePercent, premium, terms: terms || undefined });
      setMsg("Bid placed"); onChangePercent(25); setTerms(""); onBidPlaced();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Bid failed");
    } finally { setBusy(false); }
  }

  return (
    <li>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium">{item.title}</div>
            <p className="text-sm text-slate-600 mt-1">{item.summary || "—"}</p>
            <div className="mt-2 grid gap-1 text-xs text-slate-600">
              <div>Target: <span className="font-medium">{target}%</span></div>
              <div>Budget: <span className="font-medium">{fmtMoney(sumInsured, currency)}</span></div>
              <div>Per 1%: <span className="font-medium">{fmtMoney(onePercentAmount, currency)}</span></div>
            </div>
          </div>

          {hasBid ? (
            accepted ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-3 py-1">Accepted</span>
                <Button size="sm" variant="secondary" onClick={onSeeCompany}>See company</Button>
              </div>
            ) : (
              <span className="rounded-full bg-slate-100 text-slate-700 text-xs px-3 py-1">Bid sent</span>
            )
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { if (!open) onChangePercent(coveragePercent || 25); setOpen(v => !v); }}
              disabled={!canBid}
              title={!canBid ? "Bidding is available after KYC approval" : undefined}
            >
              {open ? "Hide bid" : "Place bid"}
            </Button>
          )}
        </div>

        {!hasBid && open && (
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
            {msg && <div className="sm:col-span-3 rounded-lg border border-green-300 bg-green-50 text-green-700 p-2 text-sm">{msg}</div>}
            {err && <div className="sm:col-span-3 rounded-lg border border-red-300 bg-red-50 text-red-700 p-2 text-sm">{err}</div>}
            <div>
              <Label>Coverage %</Label>
              <Input type="number" min={1} max={100} step="0.01" value={coveragePercent} onChange={(e) => onChangePercent(Number(e.target.value))} />
              <p className="mt-1 text-[11px] text-slate-500">Your coverage amount: <strong>{fmtMoney(coverageAmount, currency)}</strong></p>
            </div>
            <div>
              <Label>Premium</Label>
              <Input type="number" min={0} step="0.01" value={premium} onChange={(e) => onChangePremium(Number(e.target.value))} />
              <p className="mt-1 text-[11px] text-slate-500">Currency: {currency} • Linked to coverage</p>
            </div>
            <div className="sm:col-span-3">
              <Label>Terms</Label>
              <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Standard terms" />
            </div>
            <div className="sm:col-span-3">
              <Button disabled={busy || !canBid || !(coveragePercent >= 1 && coveragePercent <= 100)}>{busy ? "Placing…" : "Place bid"}</Button>
            </div>
          </form>
        )}
      </Card>
    </li>
  );
}

/* ---------- Pager ---------- */
function Pager({ page, hasMore, onPrev, onNext }: { page: number; hasMore: boolean; onPrev: () => void; onNext: () => void; }) {
  return (
    <div className="flex items-center gap-2">
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

/* ---------- desktop/tablet filter form ---------- */
function FilterForm(props: {
  q: string; setQ: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  minSum: string; setMinSum: (v: string) => void;
  maxSum: string; setMaxSum: (v: string) => void;
  sort: OpenReqQuery["sort"]; setSort: (v: OpenReqQuery["sort"]) => void;
  dirty: boolean; onApply: () => void; onReset: () => void; subtitle: string;
}) {
  const { q, setQ, country, setCountry, minSum, setMinSum, maxSum, setMaxSum, sort, setSort, dirty, onApply, onReset, subtitle } = props;
  return (
    <Card>
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative">
          <Label>Search</Label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, summary, asset…" className="pl-8" />
          <Search size={16} className="absolute left-2 bottom-2.5 text-slate-400" />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
        </div>
        <div>
          <Label>Min budget</Label>
          <Input type="number" min={0} value={minSum} onChange={(e) => setMinSum(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Max budget</Label>
          <Input type="number" min={0} value={maxSum} onChange={(e) => setMaxSum(e.target.value)} placeholder="20000000" />
        </div>
        <div>
          <Label>Sort</Label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="new">Newest</option>
            <option value="sum_desc">Budget (high → low)</option>
            <option value="deadline_asc">Deadline (soonest)</option>
          </select>
        </div>
        <div className="ml-auto flex items-end gap-2">
          <Button variant="secondary" onClick={onReset}><SlidersHorizontal size={16} className="mr-2" /> Reset</Button>
          <Button onClick={onApply} disabled={!dirty}><Filter size={16} className="mr-2" /> Apply</Button>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">{subtitle}</div>
    </Card>
  );
}

/* ---------- Company modal ---------- */
function CompanyModal({ open, onClose, title, company, loading, error }: { open: boolean; onClose: () => void; title: string; company: CompanyCard | null; loading: boolean; error: string | null; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Company – {title}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-4">
          {loading && <div className="text-sm text-slate-600">Loading…</div>}
          {error && <div className="text-sm text-red-700">{error}</div>}
          {!loading && !error && company && (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {company.name}</div>
              {company.orgName && <div><span className="font-medium">Org:</span> {company.orgName}</div>}
              <div><span className="font-medium">Email:</span> {company.email || "—"}</div>
              {company.email && <div className="pt-2"><a className="underline text-indigo-600" href={`mailto:${company.email}`}>Send email</a></div>}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );
}
