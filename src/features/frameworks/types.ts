export type FrameworkStatus = "draft" | "published" | "archived";

export type Framework = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: FrameworkStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FrameworkInput = {
  code: string;
  name: string;
  description: string | null;
  status: FrameworkStatus;
  is_active: boolean;
};

export type FrameworkSortField = "code" | "name" | "status" | "is_active" | "created_at" | "updated_at";
export type SortDirection = "asc" | "desc";

export type ListFrameworksParams = {
  search?: string;
  sortField: FrameworkSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
};

export type ListFrameworksResult = {
  rows: Framework[];
  total: number;
};