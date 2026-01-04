import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TodoApp } from './components/todos/TodoApp';
import { Toaster } from './components/ui/sonner';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Redirect root to /todos */}
        <Route path="/" element={<Navigate to="/todos" replace />} />

        {/* Main todo routes with optional status filter */}
        <Route path="/todos" element={<TodoApp />}>
          {/* Modal routes render on top of the todo list */}
          <Route path="new" element={null} />
          <Route path=":id/edit" element={null} />
        </Route>
        <Route path="/todos/active" element={<TodoApp />}>
          <Route path="new" element={null} />
          <Route path=":id/edit" element={null} />
        </Route>
        <Route path="/todos/completed" element={<TodoApp />}>
          <Route path="new" element={null} />
          <Route path=":id/edit" element={null} />
        </Route>

        {/* Category manager modal route */}
        <Route path="/categories" element={<TodoApp />} />

        {/* Fallback - redirect unknown routes to /todos */}
        <Route path="*" element={<Navigate to="/todos" replace />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
