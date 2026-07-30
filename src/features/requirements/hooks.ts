import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  countRequirementDependencies,
  createRequirement,
  deleteRequirement,
  listRequirements,
  listSelectablePrinciples,
  updateRequirement,
} from "./service";
import type {
  ListRequirementsParams,
  RequirementCreateInput,
  RequirementUpdateInput,
} from "./types";

const KEY = "requirements";
const PRINCIPLE_KEY = "requirements_principle_options";
const DEP_KEY = "requirements_dependency_counts";

export function useRequirements(params: ListRequirementsParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listRequirements(params),
    placeholderData: (prev) => prev,
  });
}

export function usePrincipleOptions(enabled: boolean) {
  return useQuery({
    queryKey: [PRINCIPLE_KEY],
    queryFn: () => listSelectablePrinciples(),
    enabled,
    staleTime: 30_000,
  });
}

export function useRequirementDependencies(requirementId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [DEP_KEY, requirementId],
    queryFn: () => countRequirementDependencies(requirementId as string),
    enabled: Boolean(requirementId) && enabled,
  });
}

export function useCreateRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RequirementCreateInput) => createRequirement(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RequirementUpdateInput }) =>
      updateRequirement(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRequirement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}