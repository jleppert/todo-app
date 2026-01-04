import React from 'react';
import { CategoryItem } from './CategoryItem';
import type { Category } from '@/types';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  if (categories.length === 0) {
    return (
      <div
        className="py-8 text-center text-muted-foreground"
        data-testid="no-categories"
      >
        No categories yet. Create one to organize your todos.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="category-list">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
