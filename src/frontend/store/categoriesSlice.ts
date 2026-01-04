import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Category, CreateCategoryInput, UpdateCategoryInput, ApiResponse } from '../types';

export interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch categories');
    }
    const result: ApiResponse<Category[]> = await response.json();
    return result.data;
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (input: CreateCategoryInput) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create category');
    }
    const result: ApiResponse<Category> = await response.json();
    return result.data;
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, input }: { id: number; input: UpdateCategoryInput }) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update category');
    }
    const result: ApiResponse<Category> = await response.json();
    return result.data;
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: number) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete category');
    }
    return id;
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoriesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Unknown error';
      })
      // createCategory
      .addCase(createCategory.pending, (state) => {
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        state.items.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      })
      // updateCategory
      .addCase(updateCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        const index = state.items.findIndex((cat) => cat.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      })
      // deleteCategory
      .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((cat) => cat.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.error.message || 'Unknown error';
      });
  },
});

export const { clearCategoriesError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
