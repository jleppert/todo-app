import React from 'react';
import { Button } from '@/components/ui/button';
import type { StatusFilter } from '@/types';

interface EmptyStateProps {
  statusFilter: StatusFilter;
  hasCategory: boolean;
  onCreateTodo: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  statusFilter,
  hasCategory,
  onCreateTodo,
}) => {
  const getMessage = () => {
    if (hasCategory) {
      switch (statusFilter) {
        case 'active':
          return 'No active todos in this category.';
        case 'completed':
          return 'No completed todos in this category.';
        default:
          return 'No todos in this category yet.';
      }
    }

    switch (statusFilter) {
      case 'active':
        return 'No active todos. Time to add something!';
      case 'completed':
        return 'No completed todos yet. Keep working!';
      default:
        return 'No todos yet. Create your first one!';
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="empty-state"
    >
      <div className="mb-4 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <p className="mb-4 text-muted-foreground">{getMessage()}</p>
      {statusFilter === 'all' && (
        <Button onClick={onCreateTodo} data-testid="create-first-todo">
          Create Todo
        </Button>
      )}
    </div>
  );
};
