import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { SejourDTO } from '../types/api';

export interface SejourState {
  sejourCourant: SejourDTO | null;
  sejoursDisponibles: SejourDTO[];
}

const initialState: SejourState = {
  sejourCourant: null,
  sejoursDisponibles: [],
};

const sejourSlice = createSlice({
  name: 'sejour',
  initialState,
  reducers: {
    setSejoursDisponibles: (state, action: PayloadAction<SejourDTO[]>) => {
      state.sejoursDisponibles = action.payload;
    },
    setSejourCourant: (state, action: PayloadAction<SejourDTO | null>) => {
      state.sejourCourant = action.payload;
    },
    clearSejour: (state) => {
      state.sejourCourant = null;
      state.sejoursDisponibles = [];
    },
  },
});

export const { setSejoursDisponibles, setSejourCourant, clearSejour } = sejourSlice.actions;
export default sejourSlice.reducer;
