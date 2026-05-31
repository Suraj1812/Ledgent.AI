import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AppState = {
  sidebarOpen: boolean;
};

const initialState: AppState = {
  sidebarOpen: false
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    }
  }
});

export const { setSidebarOpen } = appSlice.actions;
export const appReducer = appSlice.reducer;
