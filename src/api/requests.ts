import { api } from "./client";
import type { InsuranceRequest, Bid, Consortium } from "../type";

export async function getRequest(id: string) {
  const { data } = await api.get<InsuranceRequest>(`/requests/${id}`);
  return data;
}

export async function getRequestBids(id: string) {
  const { data } = await api.get(`/requests/${id}/bids`);
  // Owner/admin gets an array; enforce array shape for callers.
  return (Array.isArray(data) ? data : []) as Bid[];
}

export async function getConsortium(id: string) {
  const { data } = await api.get(`/requests/${id}/consortium`);
  // Backend returns null if none (200). Keep that.
  return (data || null) as Consortium | null;
}

export async function createConsortium(id: string, selectedBidIds: string[]) {
  const { data } = await api.post(`/requests/${id}/consortium`, { selectedBidIds });
  return data;
}

export async function finalizeConsortium(id: string) {
  const { data } = await api.post(`/requests/${id}/consortium/finalize`);
  return data;
}
