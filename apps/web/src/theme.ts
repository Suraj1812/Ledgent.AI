import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b342b",
      dark: "#211c17",
      light: "#655a4c"
    },
    secondary: {
      main: "#e7c68b",
      dark: "#c99d5c",
      light: "#f2ddb8"
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
      default: "#f6f7fb",
      paper: "#ffffff"
    },
    text: {
      primary: "#211c17",
      secondary: "#6d6255"
    },
    divider: "#eadcc7"
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
        root: {
          border: "1px solid #eadcc7",
          boxShadow: "0 10px 30px rgba(59, 52, 43, 0.08)"
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
