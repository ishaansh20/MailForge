import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button.jsx";

function Drawer({
  open,
  title,
  children,
  onClose,
  side = "left",
  width = "w-80",
}) {
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

  const positionClass = side === "right" ? "right-0" : "left-0";

  return createPortal(
    <div className="fixed inset-0 z-50 bg-stone-950/40">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <aside
        className={`absolute top-0 ${positionClass} h-full ${width} border-r border-stone-200 bg-white shadow-[var(--shadow-dialog)]`}
      >
        <div className="flex h-16 items-center justify-between border-b border-stone-200 px-4">
          <h3 className="text-base font-semibold text-stone-950">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </Button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
          {children}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

export { Drawer };
