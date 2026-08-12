import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button.jsx";

function Modal({ open, title, children, onClose, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }

    return undefined;
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-2 py-3 sm:px-4 sm:py-6 backdrop-blur-sm [animation:ems-fade-in_150ms_ease-out]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={`flex max-h-[calc(100vh-1.5rem)] w-full ${maxWidth} sm:max-h-[calc(100vh-3rem)] flex-col rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-dialog)] [animation:ems-scale-in_200ms_var(--ease-out)]`}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:gap-4 sm:px-6 sm:pt-6">
          <div>
            <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export { Modal };
