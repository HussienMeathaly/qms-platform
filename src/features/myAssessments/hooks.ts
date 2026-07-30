import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { listMyAssessments } from "./service";

export function useMyAssessments() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: ["my-assessments", userId],
    queryFn: () => listMyAssessments(userId),
    enabled: Boolean(userId),
  });
}