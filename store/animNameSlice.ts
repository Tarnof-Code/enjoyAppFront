import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const animNameSlice = createSlice({
  name: 'animName',
  initialState: '' as string,
  reducers: {
    setName: (_state, action: PayloadAction<string>) =>
      (action.payload || '').toUpperCase(),
  },
});

export const { setName } = animNameSlice.actions;
export default animNameSlice.reducer;
