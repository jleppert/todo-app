import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState(category?.name || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(category?.name || '');
    setError('');
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Category name is required');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Category name must be 50 characters or less');
      return;
    }
    onSubmit(trimmedName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="category-form">
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="Enter category name"
          maxLength={50}
          disabled={isSubmitting}
          data-testid="category-name-input"
        />
        {error && (
          <p className="text-sm text-destructive" data-testid="category-form-error">
            {error}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="category-submit">
          {isSubmitting ? 'Saving...' : category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
