'use client';

import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from './features/general/sidebarSlice';
import listingsReducer from './features/listings/listingsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: { sidebar: sidebarReducer, listings: listingsReducer },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
