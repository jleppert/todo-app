import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Category, TodoFilters as TodoFiltersType, StatusFilter, SortBy, SortOrder } from '@/types';

interface TodoFiltersProps {
  filters: TodoFiltersType;
  categories: Category[];
  onStatusChange: (status: StatusFilter) => void;
  onCategoryChange: (categoryId: number | null) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (sortOrder: SortOrder) => void;
  onGroupByCategoryChange: (groupByCategory: boolean) => void;
}

export const TodoFilters: React.FC<TodoFiltersProps> = ({
  filters,
  categories,
  onStatusChange,
  onCategoryChange,
  onSortByChange,
  onSortOrderChange,
  onGroupByCategoryChange,
}) => {
  return (
    <div className="space-y-4" data-testid="todo-filters">
      <Tabs
        value={filters.status}
        onValueChange={(value) => onStatusChange(value as StatusFilter)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1" data-testid="filter-all">
            All
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1" data-testid="filter-active">
            Active
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1" data-testid="filter-completed">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="category-filter" className="mb-2 block text-sm">
            Category
          </Label>
          <Select
            value={filters.categoryId === null ? 'all' : String(filters.categoryId)}
            onValueChange={(value) =>
              onCategoryChange(value === 'all' ? null : parseInt(value, 10))
            }
          >
            <SelectTrigger id="category-filter" data-testid="category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="sort-by" className="mb-2 block text-sm">
            Sort by
          </Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onSortByChange(value as SortBy)}
          >
            <SelectTrigger id="sort-by" data-testid="sort-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created date</SelectItem>
              <SelectItem value="dueDate">Due date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onSortOrderChange(filters.sortOrder === 'asc' ? 'desc' : 'asc')
            }
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            data-testid="sort-order"
          >
            {filters.sortOrder === 'asc' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="group-by-category"
          checked={filters.groupByCategory}
          onCheckedChange={(checked) => onGroupByCategoryChange(checked === true)}
          data-testid="group-by-category"
        />
        <Label htmlFor="group-by-category" className="text-sm font-normal cursor-pointer">
          Group by category
        </Label>
      </div>
    </div>
  );
};
