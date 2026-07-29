import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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