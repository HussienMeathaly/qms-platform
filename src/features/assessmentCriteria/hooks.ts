import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  countAssessmentCriterionDependencies,
  createAssessmentCriterion,
  deleteAssessmentCriterion,
  listAssessmentCriteria,
  listSelectableRequirements,
  updateAssessmentCriterion,
} from "./service";
import type {
  AssessmentCriterionCreateInput,
  AssessmentCriterionUpdateInput,
  ListAssessmentCriteriaParams,
} from "./types";

const KEY = "assessment_criteria";
const REQUIREMENT_KEY = "assessment_criteria_requirement_options";
const DEP_KEY = "assessment_criteria_dependency_counts";

export function useAssessmentCriteria(params: ListAssessmentCriteriaParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => listAssessmentCriteria(params),
    placeholderData: (prev) => prev,
  });
}

export function useRequirementOptions(enabled: boolean) {
  return useQuery({
    queryKey: [REQUIREMENT_KEY],
    queryFn: () => listSelectableRequirements(),
    enabled,
    staleTime: 30_000,
  });
}

export function useAssessmentCriterionDependencies(
  criterionId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [DEP_KEY, criterionId],
    queryFn: () => countAssessmentCriterionDependencies(criterionId as string),
    enabled: Boolean(criterionId) && enabled,
  });
}

export function useCreateAssessmentCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessmentCriterionCreateInput) => createAssessmentCriterion(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAssessmentCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssessmentCriterionUpdateInput }) =>
      updateAssessmentCriterion(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteAssessmentCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssessmentCriterion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}