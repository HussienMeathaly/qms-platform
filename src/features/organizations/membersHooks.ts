import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMember,
  listMembers,
  listUserProfiles,
  removeMember,
  updateMemberRole,
  type OrganizationRole,
} from "./membersService";

const MEMBERS_KEY = "organization-members";
const PROFILES_KEY = "user-profiles";

export function useOrganizationMembers(organizationId: string | null) {
  return useQuery({
    queryKey: [MEMBERS_KEY, organizationId],
    queryFn: () => listMembers(organizationId as string),
    enabled: Boolean(organizationId),
  });
}

export function useUserProfiles(enabled: boolean) {
  return useQuery({
    queryKey: [PROFILES_KEY],
    queryFn: listUserProfiles,
    enabled,
  });
}

export function useAddMember(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role: OrganizationRole }) =>
      addMember({ organizationId: organizationId as string, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEMBERS_KEY, organizationId] }),
  });
}

export function useUpdateMemberRole(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role: OrganizationRole }) =>
      updateMemberRole({ organizationId: organizationId as string, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEMBERS_KEY, organizationId] }),
  });
}

export function useRemoveMember(organizationId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      removeMember({ organizationId: organizationId as string, userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MEMBERS_KEY, organizationId] }),
  });
}