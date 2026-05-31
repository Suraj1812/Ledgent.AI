import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Ledgent UI error", { error, info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3, bgcolor: "background.default" }}>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 560 }}>
          <Typography variant="h1">Something needs attention</Typography>
          <Alert severity="error">The workspace could not finish loading. Refresh to reconnect to the latest data.</Alert>
          <Button variant="contained" startIcon={<RefreshOutlinedIcon />} onClick={() => window.location.reload()}>
            Refresh workspace
          </Button>
        </Stack>
      </Box>
    );
  }
}
