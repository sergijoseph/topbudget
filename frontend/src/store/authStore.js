import { configureStore , createSlice } from '@reduxjs/toolkit'

const initialState = {
  accessToken: null,
  user: null,
  isRefreshing: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.user = null;
    },
    setRefreshing: (state, action) => {
      state.isRefreshing = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setRefreshing } = authSlice.actions;

export const authStore = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});