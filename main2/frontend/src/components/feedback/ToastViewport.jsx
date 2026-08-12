import { Icon } from "../ui/Icon.jsx";
import { cn } from "../../utils/cn.js";
import { useToast } from "../../hooks/useToast.js";

function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  if (!toasts.length) {
    return null;
  }

  const variantClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  const iconByVariant = {
    success: "check",
    danger: "x",
    warning: "warning",
    info: "info",
  };

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[min(100%-2rem,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[var(--shadow-dialog)] [animation:ems-toast-in_250ms_var(--ease-out)]",
            variantClasses[toast.variant] || variantClasses.info,
          )}
        >
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/70">
            <Icon name={iconByVariant[toast.variant] || "info"} size={16} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? (
              <p className="text-sm leading-6 opacity-90">
                {toast.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="rounded-lg px-2 py-1 text-sm font-medium opacity-70 transition hover:opacity-100"
            aria-label="Dismiss toast"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export { ToastViewport };
