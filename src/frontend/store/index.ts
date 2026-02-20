import { configureStore } from '@reduxjs/toolkit';
import todosReducer from './todosSlice';
import categoriesReducer from './categoriesSlice';
import geoReducer from './geoSlice';

export const store = configureStore({
  reducer: {
    todos: todosReducer,
    categories: categoriesReducer,
    geo: geoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
