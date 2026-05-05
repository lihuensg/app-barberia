import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

export default function RequireAuth({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, token, isLoading } = useAuth();

  if (!token) return <Redirect to="/login" />;
  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (requireAdmin && user.rol !== "admin") return <Redirect to="/" />;

  return <>{children}</>;
}
