import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn.js";

function Dropdown({
  trigger,
  children,
  align = "right",
  className = "",
  triggerClassName = "",
  triggerAriaLabel,
  menuClassName = "",
  defaultOpen = false,
  disabled = false,
  onOpenChange,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const setDropdownOpen = useCallback(
    (nextOpen) => {
      if (disabled) {
        return;
      }

      setOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [disabled, onOpenChange],
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();

    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleDismiss() {
      setDropdownOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [setDropdownOpen]);

  const menu =
    open && position
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              ...(align === "right" ? { right: position.right } : { left: position.left }),
            }}
            className={cn(
              "z-50 min-w-48 origin-top rounded-xl border border-stone-200 bg-white p-2 shadow-[var(--shadow-dialog)] [animation:ems-scale-in_150ms_var(--ease-out)]",
              className,
              menuClassName,
            )}
          >
            {children}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={triggerAriaLabel}
        disabled={disabled}
        onClick={() => setDropdownOpen(!open)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {menu}
    </div>
  );
}

function DropdownItem({ children, onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      className={cn(
        "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ease-out hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-stone-700",
      )}
    >
      {children}
    </button>
  );
}

export { Dropdown, DropdownItem };
