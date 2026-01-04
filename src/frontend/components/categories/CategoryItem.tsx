import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types';

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className="flex items-center justify-between rounded-lg border p-3"
      data-testid={`category-item-${category.id}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{category.name}</span>
        <Badge variant="secondary">{category.todoCount} todos</Badge>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(category)}
          data-testid={`edit-category-${category.id}`}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(category)}
          data-testid={`delete-category-${category.id}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
