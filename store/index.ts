import { configureStore } from '@reduxjs/toolkit';

import overlayReducer from './overlaySlice';
import animNameReducer from './animNameSlice';

export const store = configureStore({
  reducer: {
    overlay: overlayReducer,
    animName: animNameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
