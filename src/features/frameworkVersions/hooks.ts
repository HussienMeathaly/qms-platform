import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveFrameworkVersion,
  createFrameworkVersion,
  listActiveFrameworks,
  listFrameworkVersions,
  updateFrameworkVersion,
} from "./service";
import type {
  FrameworkVersionCreateInput,
  FrameworkVersionUpdateInput,
  ListFrameworkVersionsParams,
} from "./types";

const KEY = "framework_versions";
const FW_KEY = "frameworks_ref";

export function useFrameworkVersions(params: ListFrameworkVersionsParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listFrameworkVersions(params),
    placeholderData: (prev) => prev,
  });
}

export function useActiveFrameworks(enabled: boolean) {
  return useQuery({
    queryKey: [FW_KEY, "active"],
    queryFn: () => listActiveFrameworks(),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateFrameworkVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FrameworkVersionCreateInput) => createFrameworkVersion(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFrameworkVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FrameworkVersionUpdateInput }) =>
      updateFrameworkVersion(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useArchiveFrameworkVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveFrameworkVersion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}