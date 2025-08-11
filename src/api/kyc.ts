import { api } from "./client";

export async function resubmitKyc() {
  const { data } = await api.post("/kyc/resubmit");
  return data; // { message, user: { id, kycStatus, kycResubmitCount } }
}