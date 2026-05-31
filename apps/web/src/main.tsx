import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppToast } from "./components/AppToast";
import { MetaManager } from "./components/MetaManager";
import { store, type RootState } from "./store";
import { showToast } from "./store/app-slice";
import { createAppTheme } from "./theme";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.silent) store.dispatch(showToast({ message: error.message, severity: "error" }));
    }
  }),
  mutationCache: new MutationCache({
    onError: (error) => store.dispatch(showToast({ message: error.message, severity: "error" }))
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: true
    },
    mutations: {
      retry: 0
    }
  }
});

function AppProviders() {
  const themeMode = useSelector((state: RootState) => state.app.themeMode);

  return (
    <ThemeProvider theme={createAppTheme(themeMode)}>
      <CssBaseline />
      <MetaManager />
      <BrowserRouter>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </BrowserRouter>
      <AppToast />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppProviders />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
