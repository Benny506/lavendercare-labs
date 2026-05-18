import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  session: null,
  user: null,
  labProfile: null,
  hasBootstrapped: false,
  labAvailability: [],
  labServices: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.session = action.payload.session || null;
      state.user = action.payload.user || null;
      state.labProfile = action.payload.labProfile || null;
      state.labAvailability = action.payload.labAvailability || [];
      state.labServices = action.payload.labServices || [];
      state.hasBootstrapped = true;
    },
    clearAuth: (state) => {
      state.session = null;
      state.user = null;
      state.labProfile = null;
      state.labAvailability = [];
      state.labServices = [];
      state.hasBootstrapped = true;
    },
    setLabProfile: (state, action) => {
      state.labProfile = action.payload || null;
    },
    setLabAvailability: (state, action) => {
      state.labAvailability = Array.isArray(action.payload) ? action.payload : [];
    },
    addLabAvailability: (state, action) => {
      state.labAvailability = [...state.labAvailability, action.payload];
    },
    setLabServices: (state, action) => {
      state.labServices = Array.isArray(action.payload) ? action.payload : [];
    },
    addLabService: (state, action) => {
      state.labServices = [...state.labServices, action.payload];
    },
    updateLabService: (state, action) => {
      state.labServices = state.labServices.map((s) => (s.id === action.payload.id ? action.payload : s));
    },
    markBootstrapped: (state) => {
      state.hasBootstrapped = true;
    },
  },
});

export const { setAuth, clearAuth, setLabProfile, setLabAvailability, addLabAvailability, setLabServices, addLabService, updateLabService, markBootstrapped } = authSlice.actions;
export default authSlice.reducer;
