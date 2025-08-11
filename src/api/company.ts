import { api } from "./client";
import type { CreateRequestBody, InsuranceRequest } from "../type";

export async function createRequest(body: CreateRequestBody) {
  const { data } = await api.post<InsuranceRequest>("/requests", body);
  return data;
}
export async function getMyRequests() {
  const { data } = await api.get<InsuranceRequest[]>("/requests/mine");
  return data;
}
