import { createSlice } from '@reduxjs/toolkit';

const animNameSlice = createSlice({
  name: 'animName',
  initialState: '',
  reducers: {
    setName: (state, action) => (action.payload || '').toUpperCase(),
  },
});

export const { setName } = animNameSlice.actions;
export default animNameSlice.reducer;
