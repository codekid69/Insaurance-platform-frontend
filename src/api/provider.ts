import { api } from "./client";
import type { InsuranceRequest, Bid, Award, CompanyCard } from "../type";

export type OpenReqQuery = {
  q?: string;
  country?: string;
  minSum?: number;
  maxSum?: number;
  sort?: "new" | "sum_desc" | "deadline_asc";
  page?: number;
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

function clean<T extends Record<string, any>>(o: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

export async function getOpenRequests(params: OpenReqQuery = {}): Promise<Paginated<InsuranceRequest>> {
  const res = await api.get(`/requests/open`, { params: clean(params) });
  const data = res.data;
  if (Array.isArray(data)) {
    return { items: data as InsuranceRequest[], page: 1, limit: params.limit ?? data.length, total: data.length, hasMore: false };
  }
  return data as Paginated<InsuranceRequest>;
}

export async function placeBid(requestId: string, body: { coveragePercent: number; premium: number; terms?: string }) {
  const { data } = await api.post<Bid>(`/requests/${requestId}/bids`, body);
  return data;
}

export async function getMyBidForRequest(requestId: string) {
  const { data } = await api.get(`/requests/${requestId}/bids`, { params: { mine: 1 } });
  return data; // null or Bid
}

export async function getMyAwards(): Promise<Award[]> {
  const { data } = await api.get(`/providers/me/awards`);
  if (Array.isArray(data)) return data as Award[];
  if (Array.isArray((data as any)?.items)) return (data as any).items as Award[];
  if (Array.isArray((data as any)?.data)) return (data as any).data as Award[];
  if (Array.isArray((data as any)?.data?.items)) return (data as any).data.items as Award[];
  return [];
}

export async function getRequestCompany(requestId: string): Promise<CompanyCard> {
  const { data } = await api.get(`/requests/${requestId}/company`);
  return data.company as CompanyCard;
}
