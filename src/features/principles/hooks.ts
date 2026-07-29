import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  countPrincipleRequirements,
  createPrinciple,
  deletePrinciple,
  listPrinciples,
  listSelectableLevels,
  updatePrinciple,
} from "./service";
import type {
  ListPrinciplesParams,
  PrincipleCreateInput,
  PrincipleUpdateInput,
} from "./types";

const KEY = "principles";
const LEVEL_KEY = "principles_levels_options";
const DEP_KEY = "principles_requirements_count";

export function usePrinciples(params: ListPrinciplesParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listPrinciples(params),
    placeholderData: (prev) => prev,
  });
}

export function useLevelOptions(enabled: boolean) {
  return useQuery({
    queryKey: [LEVEL_KEY],
    queryFn: () => listSelectableLevels(),
    enabled,
    staleTime: 30_000,
  });
}

export function usePrincipleRequirementCount(principleId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [DEP_KEY, principleId],
    queryFn: () => {
      if (!principleId) return Promise.resolve(0);
      return countPrincipleRequirements(principleId);
    },
    enabled: Boolean(principleId) && enabled,
  });
}

export function useCreatePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PrincipleCreateInput) => createPrinciple(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PrincipleUpdateInput }) =>
      updatePrinciple(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeletePrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePrinciple(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}