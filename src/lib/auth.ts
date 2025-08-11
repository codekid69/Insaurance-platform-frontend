// src/services/auth.ts
import { api } from "../api/client";
import type { AuthPayload, RegisterPayload, AuthResponse, User } from "../type";

const STORAGE = {
  token: "token",
  user: "user",
  role: "role",           // kept for backward compat
  kycStatus: "kycStatus", // kept for backward compat
};

const isBrowser = () => typeof window !== "undefined";

function setAuthHeader(token?: string) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

export function loadAuthOnInit() {
  if (!isBrowser()) return;
  const token = localStorage.getItem(STORAGE.token);
  if (token) setAuthHeader(token);
}

export async function login(body: AuthPayload): Promise<User> {
  try {
    const payload = { ...body, email: body.email.trim().toLowerCase() };
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    persistAuth(data);
    return data.user;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || "Login failed");
  }
}

export async function register(body: RegisterPayload): Promise<User> {
  try {
    const payload = { ...body, email: body.email.trim().toLowerCase() };
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    persistAuth(data);
    return data.user;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || "Register failed");
  }
}

export function logout() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE.token);
  localStorage.removeItem(STORAGE.user);
  // legacy keys (safe to drop later once all reads use `user`)
  localStorage.removeItem(STORAGE.role);
  localStorage.removeItem(STORAGE.kycStatus);
  setAuthHeader(undefined);
}

export function currentUser(): User | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function persistAuth({ token, user }: AuthResponse) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE.token, token);
  localStorage.setItem(STORAGE.user, JSON.stringify(user));
  // legacy keys for existing code that still reads them
  localStorage.setItem(STORAGE.role, user.role);
  localStorage.setItem(STORAGE.kycStatus, user.kycStatus);
  setAuthHeader(token);
}
