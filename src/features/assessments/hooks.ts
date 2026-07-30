import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssessmentWithResponses,
  listActiveOrganizations,
  listAssessments,
  listOrganizationMembers,
  listPublishedFrameworkVersions,
} from "./service";

const KEY = "assessments";

export function useAssessments() {
  return useQuery({ queryKey: [KEY], queryFn: () => listAssessments() });
}

export function useActiveOrganizations(enabled: boolean) {
  return useQuery({
    queryKey: ["assessments_organizations"],
    queryFn: () => listActiveOrganizations(),
    enabled,
    staleTime: 30_000,
  });
}

export function usePublishedFrameworkVersions(enabled: boolean) {
  return useQuery({
    queryKey: ["assessments_framework_versions"],
    queryFn: () => listPublishedFrameworkVersions(),
    enabled,
    staleTime: 30_000,
  });
}

export function useOrganizationMembers(organizationId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["assessments_org_members", organizationId],
    queryFn: () => listOrganizationMembers(organizationId),
    enabled: Boolean(organizationId) && enabled,
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssessmentWithResponses,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}