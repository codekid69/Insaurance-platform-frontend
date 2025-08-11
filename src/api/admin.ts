import { api } from "./client";

export type KycStatus = "pending" | "verified" | "rejected";
export type ProviderLite = {
  id: string;
  name: string;
  email: string;
  orgName?: string;
  kycStatus: KycStatus;
  submittedAt?: string;  // for admin display
  country?: string;      // from business.country
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const BASE = "/kyc"; // app.use('/kyc', kycRoutes)

export async function listPendingProviders(params: {
  q?: string;
  page?: number;
  limit?: number;
} = {}): Promise<Paginated<ProviderLite>> {
  const { data } = await api.get(`${BASE}/pending`, { params });
  const items = Array.isArray(data.items) ? data.items : [];
  const mapped: ProviderLite[] = items.map((u: any) => ({
    id: u.id ?? u._id ?? "",
    name: u.name,
    email: u.email,
    orgName: u.orgName,
    kycStatus: (u.kycStatus ?? "pending") as KycStatus,
    submittedAt: u.kycSubmittedAt,
    country: u.business?.country,
  }));
  return {
    items: mapped,
    page: Number(data.page ?? 1),
    limit: Number(data.limit ?? mapped.length),
    total: Number(data.total ?? mapped.length),
    hasMore: Boolean(data.hasMore),
  };
}

export async function approveProvider(providerId: string, notes?: string) {
  const { data } = await api.patch(`${BASE}/${providerId}/approve`, notes ? { notes } : undefined);
  return data;
}

export async function rejectProvider(providerId: string, reason?: string) {
  const { data } = await api.patch(`${BASE}/${providerId}/reject`, reason ? { reason } : undefined);
  return data;
}
