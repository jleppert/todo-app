import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { categoriesRouter } from './routes/categories.ts';
import { todosRouter } from './routes/todos.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, '../../dist/frontend')));

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/todos', todosRouter);

// Serve the React app for all other routes (must be after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export { app };
