import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AppState = {
  sidebarOpen: boolean;
  selectedOrganization: string;
  copilotOpen: boolean;
};

const initialState: AppState = {
  sidebarOpen: false,
  selectedOrganization: "Acme Industries",
  copilotOpen: false
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setCopilotOpen(state, action: PayloadAction<boolean>) {
      state.copilotOpen = action.payload;
    }
  }
});

export const { setSidebarOpen, setCopilotOpen } = appSlice.actions;
export const appReducer = appSlice.reducer;
