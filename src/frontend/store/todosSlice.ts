import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  Todo,
  GroupedTodos,
  TodoFilters,
  CreateTodoInput,
  UpdateTodoInput,
  ApiResponse,
  GroupedApiResponse,
  StatusFilter,
  SortBy,
  SortOrder,
} from '../types';

export interface TodosState {
  items: Todo[];
  grouped: GroupedTodos[] | null;
  selectedTodo: Todo | null;
  loading: boolean;
  error: string | null;
  filters: TodoFilters;
}

const initialState: TodosState = {
  items: [],
  grouped: null,
  selectedTodo: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    categoryId: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    groupByCategory: false,
  },
};

export const fetchTodos = createAsyncThunk(
  'todos/fetchTodos',
  async (_, { getState }) => {
    const state = getState() as { todos: TodosState };
    const { filters } = state.todos;
    const params = new URLSearchParams();

    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.categoryId !== null) params.set('categoryId', String(filters.categoryId));
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);
    if (filters.groupByCategory) params.set('groupByCategory', 'true');

    const response = await fetch(`/api/todos?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch todos');
    }
    return response.json();
  }
);

export const fetchTodoById = createAsyncThunk(
  'todos/fetchTodoById',
  async (id: number) => {
    const response = await fetch(`/api/todos/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch todo');
    }
    const result: ApiResponse<Todo> = await response.json();
    return result.data;
  }
);

export const createTodo = createAsyncThunk(
  'todos/createTodo',
  async (input: CreateTodoInput) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create todo');
    }
    const result: ApiResponse<Todo> = await response.json();
    return result.data;
  }
);

export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async ({ id, input }: { id: number; input: UpdateTodoInput }) => {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update todo');
    }
    const result: ApiResponse<Todo> = await response.json();
    return result.data;
  }
);

export const deleteTodo = createAsyncThunk(
  'todos/deleteTodo',
  async (id: number) => {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete todo');
    }
    return id;
  }
);

export const toggleTodo = createAsyncThunk(
  'todos/toggleTodo',
  async (id: number) => {
    const response = await fetch(`/api/todos/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to toggle todo');
    }
    const result: ApiResponse<Todo> = await response.json();
    return result.data;
  }
);

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.filters.status = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<number | null>) => {
      state.filters.categoryId = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.filters.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.filters.sortOrder = action.payload;
    },
    setGroupByCategory: (state, action: PayloadAction<boolean>) => {
      state.filters.groupByCategory = action.payload;
    },
    setSelectedTodo: (state, action: PayloadAction<Todo | null>) => {
      state.selectedTodo = action.payload;
    },
    clearTodosError: (state) => {
      state.error = null;
    },
    removeTodoOptimistic: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((todo) => todo.id !== action.payload);
      if (state.grouped) {
        state.grouped = state.grouped.map((group) => ({
          ...group,
          todos: group.todos.filter((todo) => todo.id !== action.payload),
        })).filter((group) => group.todos.length > 0);
      }
    },
    restoreTodo: (state, action: PayloadAction<Todo>) => {
      state.items.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTodos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        if (state.filters.groupByCategory && action.payload.data?.grouped) {
          state.grouped = action.payload.data.grouped;
          state.items = [];
        } else {
          state.items = action.payload.data;
          state.grouped = null;
        }
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Unknown error';
      })
      // fetchTodoById
      .addCase(fetchTodoById.fulfilled, (state, action: PayloadAction<Todo>) => {
        state.selectedTodo = action.payload;
      })
      .addCase(fetchTodoById.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      })
      // createTodo
      .addCase(createTodo.fulfilled, (state, action: PayloadAction<Todo>) => {
        state.items.unshift(action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      })
      // updateTodo
      .addCase(updateTodo.fulfilled, (state, action: PayloadAction<Todo>) => {
        const index = state.items.findIndex((todo) => todo.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedTodo?.id === action.payload.id) {
          state.selectedTodo = action.payload;
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      })
      // deleteTodo
      .addCase(deleteTodo.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((todo) => todo.id !== action.payload);
        if (state.selectedTodo?.id === action.payload) {
          state.selectedTodo = null;
        }
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      })
      // toggleTodo
      .addCase(toggleTodo.fulfilled, (state, action: PayloadAction<Todo>) => {
        const index = state.items.findIndex((todo) => todo.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.grouped) {
          for (const group of state.grouped) {
            const todoIndex = group.todos.findIndex((todo) => todo.id === action.payload.id);
            if (todoIndex !== -1) {
              group.todos[todoIndex] = action.payload;
              break;
            }
          }
        }
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      });
  },
});

export const {
  setStatusFilter,
  setCategoryFilter,
  setSortBy,
  setSortOrder,
  setGroupByCategory,
  setSelectedTodo,
  clearTodosError,
  removeTodoOptimistic,
  restoreTodo,
} = todosSlice.actions;

export default todosSlice.reducer;
