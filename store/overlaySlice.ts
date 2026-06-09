import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface OverlayState {
  visible: boolean;
  date: string | null;
}

const initialState: OverlayState = {
  visible: false,
  date: null,
};

const overlaySlice = createSlice({
  name: 'overlay',
  initialState,
  reducers: {
    show: (state, action: PayloadAction<string>) => {
      state.visible = true;
      state.date = action.payload;
    },
    hide: (state) => {
      state.visible = false;
      state.date = null;
    },
  },
});

export const { show, hide } = overlaySlice.actions;
export default overlaySlice.reducer;
