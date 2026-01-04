import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/shared/Header';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { TodoList } from './TodoList';
import { TodoForm } from './TodoForm';
import { TodoFilters } from './TodoFilters';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  setStatusFilter,
  setCategoryFilter,
  setSortBy,
  setSortOrder,
  setGroupByCategory,
  removeTodoOptimistic,
  restoreTodo,
} from '@/store/todosSlice';
import { fetchCategories } from '@/store/categoriesSlice';
import type { Todo, CreateTodoInput, UpdateTodoInput, StatusFilter } from '@/types';
import { toast } from 'sonner';

// Helper to extract status from URL path
const getStatusFromPath = (pathname: string): StatusFilter => {
  if (pathname.includes('/active')) return 'active';
  if (pathname.includes('/completed')) return 'completed';
  return 'all';
};

// Helper to get base path for current status
const getBasePath = (status: StatusFilter): string => {
  if (status === 'active') return '/todos/active';
  if (status === 'completed') return '/todos/completed';
  return '/todos';
};

export const TodoApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();

  const { items, grouped, loading, error, filters } = useAppSelector(
    (state) => state.todos
  );
  const { items: categories } = useAppSelector((state) => state.categories);

  const deletedTodoRef = useRef<Todo | null>(null);

  // Derive modal states from URL
  const showCategoryManager = location.pathname === '/categories';
  const showNewTodoForm = location.pathname.endsWith('/new');
  const editTodoId = params.id ? parseInt(params.id, 10) : null;
  const showEditTodoForm = editTodoId !== null;
  const showTodoForm = showNewTodoForm || showEditTodoForm;

  // Find the todo being edited
  const editingTodo = editTodoId ? items.find((t) => t.id === editTodoId) : undefined;

  // Update page title based on current route
  useEffect(() => {
    let title = 'Todo App';

    if (showCategoryManager) {
      title = 'Manage Categories - Todo App';
    } else if (showNewTodoForm) {
      title = 'New Todo - Todo App';
    } else if (showEditTodoForm) {
      const todoTitle = editingTodo?.title;
      title = todoTitle ? `Edit: ${todoTitle} - Todo App` : 'Edit Todo - Todo App';
    } else {
      const statusFromPath = getStatusFromPath(location.pathname);
      if (statusFromPath === 'active') {
        title = 'Active Todos - Todo App';
      } else if (statusFromPath === 'completed') {
        title = 'Completed Todos - Todo App';
      } else {
        title = 'All Todos - Todo App';
      }
    }

    document.title = title;
  }, [location.pathname, showCategoryManager, showNewTodoForm, showEditTodoForm, editingTodo?.title]);

  // Sync URL state to Redux on mount and URL changes
  useEffect(() => {
    const urlStatus = getStatusFromPath(location.pathname);
    const urlCategoryId = searchParams.get('category');
    const categoryId = urlCategoryId ? parseInt(urlCategoryId, 10) : null;

    // Only dispatch if different from current Redux state
    if (filters.status !== urlStatus) {
      dispatch(setStatusFilter(urlStatus));
    }
    if (filters.categoryId !== categoryId) {
      dispatch(setCategoryFilter(categoryId));
    }
  }, [location.pathname, searchParams, dispatch, filters.status, filters.categoryId]);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchTodos());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch todos when filters change
  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch, filters]);

  const handleToggle = useCallback(
    async (id: number) => {
      try {
        await dispatch(toggleTodo(id)).unwrap();
        // Re-fetch if status filter is active to update the filtered view
        if (filters.status !== 'all') {
          dispatch(fetchTodos());
        }
      } catch {
        toast.error('Failed to toggle todo');
      }
    },
    [dispatch, filters.status]
  );

  const handleEdit = useCallback((todo: Todo) => {
    const basePath = getBasePath(filters.status);
    const categoryParam = searchParams.get('category');
    const queryString = categoryParam ? `?category=${categoryParam}` : '';
    navigate(`${basePath}/${todo.id}/edit${queryString}`);
  }, [navigate, filters.status, searchParams]);

  const handleDelete = useCallback(
    async (todo: Todo) => {
      deletedTodoRef.current = todo;
      dispatch(removeTodoOptimistic(todo.id));

      toast('Todo deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            if (deletedTodoRef.current) {
              dispatch(restoreTodo(deletedTodoRef.current));
              deletedTodoRef.current = null;
            }
          },
        },
        duration: 5000,
        onDismiss: async () => {
          if (deletedTodoRef.current) {
            try {
              await dispatch(deleteTodo(deletedTodoRef.current.id)).unwrap();
            } catch {
              dispatch(restoreTodo(deletedTodoRef.current!));
              toast.error('Failed to delete todo');
            }
            deletedTodoRef.current = null;
          }
        },
        onAutoClose: async () => {
          if (deletedTodoRef.current) {
            try {
              await dispatch(deleteTodo(deletedTodoRef.current.id)).unwrap();
            } catch {
              dispatch(restoreTodo(deletedTodoRef.current!));
              toast.error('Failed to delete todo');
            }
            deletedTodoRef.current = null;
          }
        },
      });
    },
    [dispatch]
  );

  const handleCreateTodo = useCallback(() => {
    const basePath = getBasePath(filters.status);
    const categoryParam = searchParams.get('category');
    const queryString = categoryParam ? `?category=${categoryParam}` : '';
    navigate(`${basePath}/new${queryString}`);
  }, [navigate, filters.status, searchParams]);

  const handleFormSubmit = useCallback(
    async (input: CreateTodoInput | UpdateTodoInput) => {
      try {
        if (editingTodo) {
          await dispatch(
            updateTodo({ id: editingTodo.id, input: input as UpdateTodoInput })
          ).unwrap();
          toast.success('Todo updated');
        } else {
          await dispatch(createTodo(input as CreateTodoInput)).unwrap();
          toast.success('Todo created');
        }
        dispatch(fetchTodos());
        // Navigate back to close the modal
        const basePath = getBasePath(filters.status);
        const categoryParam = searchParams.get('category');
        const queryString = categoryParam ? `?category=${categoryParam}` : '';
        navigate(`${basePath}${queryString}`);
      } catch {
        toast.error(editingTodo ? 'Failed to update todo' : 'Failed to create todo');
        throw new Error('Failed to save todo');
      }
    },
    [dispatch, editingTodo, navigate, filters.status, searchParams]
  );

  const handleRetry = useCallback(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background" data-testid="todo-app">
      <Header onManageCategories={() => navigate('/categories')} />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <TodoFilters
              filters={filters}
              categories={categories}
              onStatusChange={(status) => {
                const basePath = getBasePath(status);
                const categoryParam = searchParams.get('category');
                const queryString = categoryParam ? `?category=${categoryParam}` : '';
                navigate(`${basePath}${queryString}`);
              }}
              onCategoryChange={(categoryId) => {
                const basePath = getBasePath(filters.status);
                if (categoryId === null) {
                  navigate(basePath);
                } else {
                  navigate(`${basePath}?category=${categoryId}`);
                }
              }}
              onSortByChange={(sortBy) => dispatch(setSortBy(sortBy))}
              onSortOrderChange={(sortOrder) => dispatch(setSortOrder(sortOrder))}
              onGroupByCategoryChange={(groupByCategory) =>
                dispatch(setGroupByCategory(groupByCategory))
              }
            />

            <Separator className="my-6" />

            <TodoList
              todos={items}
              grouped={grouped}
              isGrouped={filters.groupByCategory}
              loading={loading}
              error={error}
              statusFilter={filters.status}
              hasCategory={filters.categoryId !== null}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRetry={handleRetry}
              onCreateTodo={handleCreateTodo}
            />
          </CardContent>
        </Card>

        <Button
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={handleCreateTodo}
          data-testid="add-todo-fab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="sr-only">Add Todo</span>
        </Button>
      </main>

      <CategoryManager
        open={showCategoryManager}
        onOpenChange={(open) => {
          if (!open) {
            const basePath = getBasePath(filters.status);
            const categoryParam = searchParams.get('category');
            const queryString = categoryParam ? `?category=${categoryParam}` : '';
            navigate(`${basePath}${queryString}`);
          }
        }}
      />

      <TodoForm
        open={showTodoForm}
        onOpenChange={(open) => {
          if (!open) {
            const basePath = getBasePath(filters.status);
            const categoryParam = searchParams.get('category');
            const queryString = categoryParam ? `?category=${categoryParam}` : '';
            navigate(`${basePath}${queryString}`);
          }
        }}
        todo={editingTodo}
        categories={categories}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
