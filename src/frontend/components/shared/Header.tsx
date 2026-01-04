import React from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onManageCategories: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onManageCategories }) => {
  return (
    <header className="border-b bg-background" data-testid="app-header">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <h1 className="text-2xl font-bold">Todo App</h1>
        <Button variant="outline" onClick={onManageCategories} data-testid="manage-categories">
          Manage Categories
        </Button>
      </div>
    </header>
  );
};
