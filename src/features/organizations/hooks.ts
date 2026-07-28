import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  deleteOrganization,
  listOrganizations,
  updateOrganization,
} from "./service";
import type { ListOrganizationsParams, OrganizationInput } from "./types";

const KEY = "organizations";

export function useOrganizations(params: ListOrganizationsParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listOrganizations(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganizationInput) => createOrganization(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrganizationInput }) =>
      updateOrganization(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}