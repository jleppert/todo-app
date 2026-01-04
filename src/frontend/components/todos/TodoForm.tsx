import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Todo, Category, CreateTodoInput, UpdateTodoInput } from '@/types';

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo;
  categories: Category[];
  onSubmit: (input: CreateTodoInput | UpdateTodoInput) => Promise<void>;
}

export const TodoForm: React.FC<TodoFormProps> = ({
  open,
  onOpenChange,
  todo,
  categories,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string>('none');
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description || '');
        setDueDate(todo.dueDate ? new Date(todo.dueDate) : undefined);
        setCategoryId(todo.categoryId ? String(todo.categoryId) : 'none');
      } else {
        setTitle('');
        setDescription('');
        setDueDate(undefined);
        setCategoryId('none');
      }
      setErrors({});
    }
  }, [open, todo]);

  const validate = (): boolean => {
    const newErrors: { title?: string } = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      newErrors.title = 'Title is required';
    } else if (trimmedTitle.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const input: CreateTodoInput | UpdateTodoInput = {
        title: title.trim(),
        description: description.trim() || (todo ? null : undefined),
        dueDate: dueDate ? dueDate.toISOString() : (todo ? null : undefined),
        categoryId: categoryId !== 'none' ? parseInt(categoryId, 10) : (todo ? null : undefined),
      };

      if (todo) {
        (input as UpdateTodoInput).completed = todo.completed;
      }

      await onSubmit(input);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="todo-form">
        <DialogHeader>
          <DialogTitle>{todo ? 'Edit Todo' : 'Create Todo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="todo-title">Title *</Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({});
              }}
              placeholder="What needs to be done?"
              maxLength={200}
              disabled={isSubmitting}
              data-testid="todo-title-input"
            />
            {errors.title && (
              <p className="text-sm text-destructive" data-testid="todo-title-error">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="todo-description">Description</Label>
            <Textarea
              id="todo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              maxLength={2000}
              disabled={isSubmitting}
              data-testid="todo-description-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                  data-testid="todo-duedate-trigger"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {dueDate ? formatDate(dueDate) : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
                {dueDate && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDueDate(undefined)}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="todo-category">Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isSubmitting}
            >
              <SelectTrigger data-testid="todo-category-select">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="todo-submit">
              {isSubmitting ? 'Saving...' : todo ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
