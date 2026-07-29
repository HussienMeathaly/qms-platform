import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  countLevelPrinciples,
  createLevel,
  deleteLevel,
  listLevels,
  listSelectableFrameworkVersions,
  updateLevel,
} from "./service";
import type { LevelCreateInput, LevelUpdateInput, ListLevelsParams } from "./types";

const KEY = "levels";
const FV_KEY = "levels_framework_versions_options";
const DEP_KEY = "levels_principles_count";

export function useLevels(params: ListLevelsParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listLevels(params),
    placeholderData: (prev) => prev,
  });
}

export function useFrameworkVersionOptions(enabled: boolean) {
  return useQuery({
    queryKey: [FV_KEY],
    queryFn: () => listSelectableFrameworkVersions(),
    enabled,
    staleTime: 30_000,
  });
}

export function useLevelPrincipleCount(levelId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [DEP_KEY, levelId],
    queryFn: () => countLevelPrinciples(levelId as string),
    enabled: Boolean(levelId) && enabled,
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LevelCreateInput) => createLevel(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LevelUpdateInput }) =>
      updateLevel(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLevel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}