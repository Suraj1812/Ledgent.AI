import { Alert, Snackbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { hideToast } from "../store/app-slice";

export function AppToast() {
  const dispatch = useDispatch();
  const toast = useSelector((state: RootState) => state.app.toast);

  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={4200}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      onClose={() => dispatch(hideToast())}
    >
      <Alert severity={toast.severity} variant="filled" onClose={() => dispatch(hideToast())}>
        {toast.message}
      </Alert>
    </Snackbar>
  );
}
