import { store } from "../store";
import { showToast, type ToastSeverity } from "../store/app-slice";

export function notify(message: string, severity: ToastSeverity = "success") {
  store.dispatch(showToast({ message, severity }));
}
