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

export type ProcessClause = {
  id: string;
  framework_version_id: string;
  code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  framework_version: FrameworkVersionRef | null;
};

export type ProcessClauseCreateInput = {
  framework_version_id: string;
  code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
};

export type ProcessClauseUpdateInput = ProcessClauseCreateInput;

export type ProcessClauseSortField =
  | "framework"
  | "version"
  | "code"
  | "display_name"
  | "sort_order"
  | "created_at"
  | "updated_at";

export type SortDirection = "asc" | "desc";

export type ListProcessClausesParams = {
  search?: string;
  sortField: ProcessClauseSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListProcessClausesResult = {
  rows: ProcessClause[];
  total: number;
};

export type FrameworkVersionOption = {
  id: string;
  version_number: string;
  version_name: string;
  status: "draft" | "published" | "archived";
  framework_code: string;
  framework_name: string;
};

export type ProcessClauseDependencyCounts = {
  requirement_process_clauses: number;
};