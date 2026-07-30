export type FrameworkRef = {
  id: string;
  code: string;
  name: string;
};

export type FrameworkVersionRef = {
  id: string;
  version_number: string;
  version_name: string;
  status: "draft" | "published" | "archived";
  framework: FrameworkRef | null;
};

export type LevelRef = {
  id: string;
  code: string;
  display_name: string;
  sort_order: number;
  framework_version: FrameworkVersionRef | null;
};

export type PrincipleRef = {
  id: string;
  code: string;
  display_name: string;
  sort_order: number;
  level: LevelRef | null;
};

export type RequirementRef = {
  id: string;
  code: string;
  title: string;
  sort_order: number;
  principle: PrincipleRef | null;
};

export type AssessmentCriterion = {
  id: string;
  requirement_id: string;
  code: string;
  criterion_text: string;
  help_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  requirement: RequirementRef | null;
};

export type AssessmentCriterionCreateInput = {
  requirement_id: string;
  code: string;
  criterion_text: string;
  help_text: string | null;
  sort_order: number;
};

export type AssessmentCriterionUpdateInput = AssessmentCriterionCreateInput;

export type AssessmentCriterionSortField =
  | "framework"
  | "version"
  | "level"
  | "principle"
  | "requirement"
  | "code"
  | "criterion_text"
  | "sort_order"
  | "created_at"
  | "updated_at";

export type SortDirection = "asc" | "desc";

export type ListAssessmentCriteriaParams = {
  search?: string;
  sortField: AssessmentCriterionSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListAssessmentCriteriaResult = {
  rows: AssessmentCriterion[];
  total: number;
};

export type RequirementOption = {
  id: string;
  code: string;
  title: string;
  sort_order: number;
  principle_code: string;
  principle_display_name: string;
  level_code: string;
  level_display_name: string;
  framework_version_number: string;
  framework_version_name: string;
  framework_version_status: "draft" | "published" | "archived";
  framework_code: string;
  framework_name: string;
};

export type AssessmentCriterionDependencyCounts = {
  assessment_responses: number;
};