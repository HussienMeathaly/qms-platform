import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  countProcessClauseDependencies,
  createProcessClause,
  deleteProcessClause,
  listProcessClauses,
  listSelectableFrameworkVersions,
  updateProcessClause,
} from "./service";
import type {
  ListProcessClausesParams,
  ProcessClauseCreateInput,
  ProcessClauseUpdateInput,
} from "./types";

const KEY = "process_clauses";
const VERSION_KEY = "process_clauses_version_options";
const DEP_KEY = "process_clauses_dependency_counts";

export function useProcessClauses(params: ListProcessClausesParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listProcessClauses(params),
    placeholderData: (prev) => prev,
  });
}

export function useFrameworkVersionOptions(enabled: boolean) {
  return useQuery({
    queryKey: [VERSION_KEY],
    queryFn: () => listSelectableFrameworkVersions(),
    enabled,
    staleTime: 30_000,
  });
}

export function useProcessClauseDependencies(clauseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [DEP_KEY, clauseId],
    queryFn: () => countProcessClauseDependencies(clauseId as string),
    enabled: Boolean(clauseId) && enabled,
  });
}

export function useCreateProcessClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcessClauseCreateInput) => createProcessClause(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProcessClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProcessClauseUpdateInput }) =>
      updateProcessClause(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteProcessClause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProcessClause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}