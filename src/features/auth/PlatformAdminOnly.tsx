import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { usePlatformAdmin } from "./usePlatformAdmin";

export function PlatformAdminOnly({ children }: { children: ReactNode }) {
  const { isPlatformAdmin, isLoading } = usePlatformAdmin();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!isPlatformAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
