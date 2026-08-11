import { createContext, useCallback, useMemo, useState } from "react";

const ToastContext = createContext(null);
let toastId = 0;

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const id = ++toastId;
      const nextToast = {
        id,
        title: toast.title,
        description: toast.description || "",
        variant: toast.variant || "info",
      };

      setToasts((currentToasts) => [nextToast, ...currentToasts].slice(0, 4));

      window.setTimeout(() => {
        dismissToast(id);
      }, toast.duration || 4000);

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
      success: (title, description, options = {}) =>
        pushToast({ title, description, variant: "success", ...options }),
      error: (title, description, options = {}) =>
        pushToast({ title, description, variant: "danger", ...options }),
      warning: (title, description, options = {}) =>
        pushToast({ title, description, variant: "warning", ...options }),
      info: (title, description, options = {}) =>
        pushToast({ title, description, variant: "info", ...options }),
    }),
    [dismissToast, pushToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export { ToastContext, ToastProvider };
