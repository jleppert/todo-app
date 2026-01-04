export interface Category {
  id: number;
  name: string;
  todoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedTodos {
  category: { id: number; name: string } | null;
  todos: Todo[];
}

export type StatusFilter = 'all' | 'active' | 'completed';
export type SortBy = 'createdAt' | 'dueDate';
export type SortOrder = 'asc' | 'desc';

export interface TodoFilters {
  status: StatusFilter;
  categoryId: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  groupByCategory: boolean;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: string;
  categoryId?: number;
}

export interface UpdateTodoInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  categoryId?: number | null;
  completed?: boolean;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

export interface ApiResponse<T> {
  data: T;
}

export interface GroupedApiResponse {
  data: {
    grouped: GroupedTodos[];
  };
}
