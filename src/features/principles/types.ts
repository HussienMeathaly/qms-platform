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

export type Principle = {
  id: string;
  level_id: string;
  code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  level: LevelRef | null;
};

export type PrincipleCreateInput = {
  level_id: string;
  code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
};

export type PrincipleUpdateInput = PrincipleCreateInput;

export type PrincipleSortField =
  | "framework"
  | "version"
  | "level"
  | "code"
  | "display_name"
  | "sort_order"
  | "created_at"
  | "updated_at";

export type SortDirection = "asc" | "desc";

export type ListPrinciplesParams = {
  search?: string;
  sortField: PrincipleSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListPrinciplesResult = {
  rows: Principle[];
  total: number;
};

export type LevelOption = {
  id: string;
  code: string;
  display_name: string;
  sort_order: number;
  framework_version_id: string;
  framework_version_number: string;
  framework_version_name: string;
  framework_version_status: "draft" | "published" | "archived";
  framework_code: string;
  framework_name: string;
};