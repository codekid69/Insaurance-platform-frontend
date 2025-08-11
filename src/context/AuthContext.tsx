import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User, Role } from "../type";
import { logout as doLogout, loadAuthOnInit } from "../lib/auth";

type AuthCtx = {
  user: User | null;
  authed: boolean;
  role: Role | null;
  setUser: (u: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

const isBrowser = () => typeof window !== "undefined";

function readUserFromStorage(): User | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { return null; }
}

function writeUserToStorage(u: User | null) {
  if (!isBrowser()) return;
  if (u) {
    localStorage.setItem("user", JSON.stringify(u));
    // convenience keys (back-compat with older reads)
    localStorage.setItem("role", u.role);
    if (u.kycStatus) localStorage.setItem("kycStatus", u.kycStatus);
  } else {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("kycStatus");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // On mount: hydrate from storage and set axios auth header
  useEffect(() => {
    if (!isBrowser()) return;
    loadAuthOnInit(); // sets axios Authorization header if token exists
    setUserState(readUserFromStorage());
    setToken(localStorage.getItem("token") || null);

    // Multi-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user") setUserState(readUserFromStorage());
      if (e.key === "token") setToken(localStorage.getItem("token"));
      if (e.key === "role" || e.key === "kycStatus") {
        // role/kyc are derived from user; no special handling needed
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function persistUser(u: User | null) {
    writeUserToStorage(u);
  }

  const setUser: AuthCtx["setUser"] = (u) => {
    setUserState(u);
    persistUser(u);
  };

  const updateUser: AuthCtx["updateUser"] = (patch) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persistUser(next);
      return next;
    });
  };

  const logout = () => {
    doLogout();              // clears storage + axios header
    setUserState(null);
    setToken(null);
    persistUser(null);
  };

  const value = useMemo(() => ({
    user,
    authed: Boolean(user && token),
    role: (user?.role ?? null) as Role | null,
    setUser,
    updateUser,
    logout,
  }), [user, token]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
