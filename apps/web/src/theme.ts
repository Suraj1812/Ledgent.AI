import { alpha, createTheme } from "@mui/material/styles";
import type { ThemeMode } from "./store/app-slice";

export function createAppTheme(mode: ThemeMode) {
  const isDark = mode === "dark";

  return createTheme({
  palette: {
    mode,
    primary: {
      main: isDark ? "#e7c68b" : "#3b342b",
      dark: isDark ? "#c99d5c" : "#211c17",
      light: isDark ? "#f2ddb8" : "#655a4c"
    },
    secondary: {
      main: isDark ? "#87c8bb" : "#d5a858",
      dark: isDark ? "#5da899" : "#b7791f",
      light: isDark ? "#b4e0d7" : "#edd3a4"
    },
    success: {
      main: "#20825c"
    },
    warning: {
      main: "#b7791f"
    },
    error: {
      main: "#c2413b"
    },
    background: {
      default: isDark ? "#171a1d" : "#f6f7fb",
      paper: isDark ? "#22272b" : "#ffffff"
    },
    text: {
      primary: isDark ? "#f5eee2" : "#211c17",
      secondary: isDark ? "#bdc5c7" : "#6d6255"
    },
    divider: isDark ? "#3d464b" : "#eadcc7"
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    h1: { fontSize: "2rem", fontWeight: 700, letterSpacing: 0 },
    h2: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: 0 },
    h3: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: 0 },
    h4: { fontSize: "1.125rem", fontWeight: 700, letterSpacing: 0 },
    h5: { fontSize: "1rem", fontWeight: 700, letterSpacing: 0 },
    h6: { fontSize: "0.875rem", fontWeight: 700, letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark ? "0 10px 30px rgba(0, 0, 0, 0.2)" : "0 10px 30px rgba(59, 52, 43, 0.08)",
          transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease"
        })
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: "background-color 180ms ease, color 180ms ease"
        },
        "*:focus-visible": {
          outline: `3px solid ${alpha(isDark ? "#e7c68b" : "#3b342b", 0.55)}`,
          outlineOffset: 2
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700
        }
      }
    }
  }
  });
}
