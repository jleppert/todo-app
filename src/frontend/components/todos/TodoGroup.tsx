import React from 'react';
import { TodoItem } from './TodoItem';
import type { GroupedTodos, Todo } from '@/types';

interface TodoGroupProps {
  group: GroupedTodos;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export const TodoGroup: React.FC<TodoGroupProps> = ({
  group,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const categoryName = group.category?.name ?? 'Uncategorized';

  return (
    <div className="space-y-3" data-testid={`todo-group-${group.category?.id ?? 'uncategorized'}`}>
      <h2 className="text-lg font-semibold text-muted-foreground">
        {categoryName}
        <span className="ml-2 text-sm font-normal">({group.todos.length})</span>
      </h2>
      <div className="space-y-2">
        {group.todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
