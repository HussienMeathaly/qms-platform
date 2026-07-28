import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveFramework,
  countFrameworkDependencies,
  createFramework,
  deleteFramework,
  listFrameworks,
  updateFramework,
} from "./service";
import type { FrameworkInput, ListFrameworksParams } from "./types";

const KEY = "frameworks";

export function useFrameworks(params: ListFrameworksParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listFrameworks(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FrameworkInput) => createFramework(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FrameworkInput }) =>
      updateFramework(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFramework(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useArchiveFramework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveFramework(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useFrameworkDependencyCount(id: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [KEY, "deps", id],
    queryFn: () => countFrameworkDependencies(id as string),
    enabled: Boolean(id) && enabled,
  });
}