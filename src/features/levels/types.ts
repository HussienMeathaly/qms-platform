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

export type Level = {
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

export type LevelCreateInput = {
  framework_version_id: string;
  code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
};

export type LevelUpdateInput = LevelCreateInput;

export type LevelSortField =
  | "framework"
  | "version"
  | "code"
  | "display_name"
  | "sort_order"
  | "created_at"
  | "updated_at";

export type SortDirection = "asc" | "desc";

export type ListLevelsParams = {
  search?: string;
  sortField: LevelSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListLevelsResult = {
  rows: Level[];
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