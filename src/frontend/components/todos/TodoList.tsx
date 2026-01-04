import React from 'react';
import { TodoItem } from './TodoItem';
import { TodoGroup } from './TodoGroup';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import type { Todo, GroupedTodos, StatusFilter } from '@/types';

interface TodoListProps {
  todos: Todo[];
  grouped: GroupedTodos[] | null;
  isGrouped: boolean;
  loading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  hasCategory: boolean;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onRetry: () => void;
  onCreateTodo: () => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  grouped,
  isGrouped,
  loading,
  error,
  statusFilter,
  hasCategory,
  onToggle,
  onEdit,
  onDelete,
  onRetry,
  onCreateTodo,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="todo-list-loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (isGrouped && grouped) {
    if (grouped.length === 0) {
      return (
        <EmptyState
          statusFilter={statusFilter}
          hasCategory={hasCategory}
          onCreateTodo={onCreateTodo}
        />
      );
    }

    return (
      <div className="space-y-6" data-testid="todo-list-grouped">
        {grouped.map((group) => (
          <TodoGroup
            key={group.category?.id ?? 'uncategorized'}
            group={group}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <EmptyState
        statusFilter={statusFilter}
        hasCategory={hasCategory}
        onCreateTodo={onCreateTodo}
      />
    );
  }

  return (
    <div className="space-y-2" data-testid="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
