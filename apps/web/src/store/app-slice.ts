import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";
export type ToastSeverity = "success" | "info" | "warning" | "error";

type AppState = {
  sidebarOpen: boolean;
  themeMode: ThemeMode;
  toast: {
    open: boolean;
    message: string;
    severity: ToastSeverity;
  };
};

const storedTheme = typeof window === "undefined" ? null : window.localStorage.getItem("ledgent.theme");

const initialState: AppState = {
  sidebarOpen: false,
  themeMode: storedTheme === "dark" ? "dark" : "light",
  toast: {
    open: false,
    message: "",
    severity: "info"
  }
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleThemeMode(state) {
      state.themeMode = state.themeMode === "light" ? "dark" : "light";
      window.localStorage.setItem("ledgent.theme", state.themeMode);
    },
    showToast(state, action: PayloadAction<{ message: string; severity?: ToastSeverity }>) {
      state.toast = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity ?? "info"
      };
    },
    hideToast(state) {
      state.toast.open = false;
    }
  }
});

export const { hideToast, setSidebarOpen, showToast, toggleThemeMode } = appSlice.actions;
export const appReducer = appSlice.reducer;
