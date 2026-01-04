import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/store/categoriesSlice';
import { fetchTodos } from '@/store/todosSlice';
import type { Category } from '@/types';
import { toast } from 'sonner';

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const dispatch = useAppDispatch();
  const { items: categories, loading, error } = useAppSelector(
    (state) => state.categories
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deletedCategoryRef = useRef<Category | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchCategories());
    }
  }, [open, dispatch]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateCategory = async (name: string) => {
    setIsSubmitting(true);
    try {
      await dispatch(createCategory({ name })).unwrap();
      setShowForm(false);
      toast.success('Category created');
    } catch {
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (name: string) => {
    if (!editingCategory) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        updateCategory({ id: editingCategory.id, input: { name } })
      ).unwrap();
      setEditingCategory(null);
      setShowForm(false);
      toast.success('Category updated');
    } catch {
      toast.error('Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = useCallback(
    async (category: Category) => {
      deletedCategoryRef.current = category;

      try {
        await dispatch(deleteCategory(category.id)).unwrap();
        dispatch(fetchTodos());

        toast('Category deleted', {
          action: {
            label: 'Undo',
            onClick: async () => {
              if (deletedCategoryRef.current) {
                try {
                  await dispatch(
                    createCategory({ name: deletedCategoryRef.current.name })
                  ).unwrap();
                  dispatch(fetchTodos());
                  toast.success('Category restored');
                } catch {
                  toast.error('Failed to restore category');
                }
              }
            },
          },
          duration: 5000,
        });
      } catch {
        toast.error('Failed to delete category');
      }
    },
    [dispatch]
  );

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="category-manager">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        {loading && !categories.length ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={() => dispatch(fetchCategories())}
          />
        ) : (
          <div className="space-y-4">
            {showForm ? (
              <CategoryForm
                category={editingCategory ?? undefined}
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                onCancel={handleCancelForm}
                isSubmitting={isSubmitting}
              />
            ) : (
              <>
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full"
                  data-testid="add-category-button"
                >
                  Add Category
                </Button>
                <Separator />
                <CategoryList
                  categories={categories}
                  onEdit={handleEdit}
                  onDelete={handleDeleteCategory}
                />
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
