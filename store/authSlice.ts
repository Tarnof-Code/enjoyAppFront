import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  tokenId: string | null;
  role: string | null;
  prenom: string | null;
  nom: string | null;
  genre: string | null;
  isAuthenticated: boolean;
  bootstrapDone: boolean;
  photoProfilRevision: number;
  photoProfilUri: string | null;
}

const initialState: AuthState = {
  tokenId: null,
  role: null,
  prenom: null,
  nom: null,
  genre: null,
  isAuthenticated: false,
  bootstrapDone: false,
  photoProfilRevision: 0,
  photoProfilUri: null,
};

interface UserFromProfil {
  tokenId: string;
  role: string;
  prenom: string;
  nom: string;
  genre: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserFromProfil: (state, action: PayloadAction<UserFromProfil>) => {
      state.tokenId = action.payload.tokenId;
      state.role = action.payload.role;
      state.prenom = action.payload.prenom;
      state.nom = action.payload.nom;
      state.genre = action.payload.genre;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.tokenId = null;
      state.role = null;
      state.prenom = null;
      state.nom = null;
      state.genre = null;
      state.isAuthenticated = false;
      state.photoProfilRevision = 0;
      state.photoProfilUri = null;
    },
    setBootstrapDone: (state) => {
      state.bootstrapDone = true;
    },
    setPhotoProfilUri: (state, action: PayloadAction<string | null>) => {
      state.photoProfilUri = action.payload;
    },
    bumpPhotoProfilRevision: (state) => {
      state.photoProfilRevision += 1;
    },
  },
});

export const {
  setUserFromProfil,
  clearUser,
  setBootstrapDone,
  setPhotoProfilUri,
  bumpPhotoProfilRevision,
} = authSlice.actions;
export default authSlice.reducer;
