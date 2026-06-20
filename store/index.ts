import { configureStore } from '@reduxjs/toolkit';

import animNameReducer from './animNameSlice';
import authReducer from './authSlice';
import sejourReducer from './sejourSlice';

export const store = configureStore({
  reducer: {
    animName: animNameReducer,
    auth: authReducer,
    sejour: sejourReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
