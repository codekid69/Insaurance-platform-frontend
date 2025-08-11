// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../type";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  roles?: Role[];
};

export default function ProtectedRoute({ children, roles }: Props) {
  const { user } = useAuth();
  const authed = !!user && !!localStorage.getItem("token");

  if (!authed) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
