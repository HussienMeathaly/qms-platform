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

export type Requirement = {
  id: string;
  principle_id: string;
  code: string;
  title: string;
  guidance: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  principle: PrincipleRef | null;
};

export type RequirementCreateInput = {
  principle_id: string;
  code: string;
  title: string;
  guidance: string | null;
  sort_order: number;
};

export type RequirementUpdateInput = RequirementCreateInput;

export type RequirementSortField =
  | "framework"
  | "version"
  | "level"
  | "principle"
  | "code"
  | "title"
  | "sort_order"
  | "created_at"
  | "updated_at";

export type SortDirection = "asc" | "desc";

export type ListRequirementsParams = {
  search?: string;
  sortField: RequirementSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListRequirementsResult = {
  rows: Requirement[];
  total: number;
};

export type PrincipleOption = {
  id: string;
  code: string;
  display_name: string;
  sort_order: number;
  level_code: string;
  level_display_name: string;
  framework_version_number: string;
  framework_version_name: string;
  framework_version_status: "draft" | "published" | "archived";
  framework_code: string;
  framework_name: string;
};

export type RequirementDependencyCounts = {
  assessment_criteria: number;
  requirement_process_clauses: number;
  review_comments: number;
};