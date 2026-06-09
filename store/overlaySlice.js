import { createSlice } from '@reduxjs/toolkit';

const overlaySlice = createSlice({
  name: 'overlay',
  initialState: { visible: false, date: null },
  reducers: {
    show: (state, action) => {
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
