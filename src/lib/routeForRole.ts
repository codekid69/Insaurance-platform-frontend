import type { Role } from "../type";

export function routeForRole(role?: Role | null) {
  if (role === "company") return "/company";
  if (role === "provider") return "/provider";
  if (role === "admin") return "/admin";
  return "/";
}
