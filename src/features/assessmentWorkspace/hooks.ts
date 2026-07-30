import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { listResponseTypes, loadWorkspace, saveResponse } from "./service";

export function useWorkspace(assessmentId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: ["assessment-workspace", assessmentId, userId],
    queryFn: () => loadWorkspace(assessmentId, userId),
    enabled: Boolean(assessmentId && userId),
    retry: false,
  });
}

export function useResponseTypes() {
  return useQuery({
    queryKey: ["response-types"],
    queryFn: () => listResponseTypes(),
    staleTime: 300_000,
  });
}

export function useSaveResponse(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveResponse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment-workspace", assessmentId] });
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
    },
  });
}