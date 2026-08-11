import { forwardRef, useEffect, useRef } from "react";
import { cn } from "../../utils/cn.js";

const Checkbox = forwardRef(function Checkbox(
  { indeterminate = false, className = "", ...props },
  forwardedRef,
) {
  const internalRef = useRef(null);

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={(node) => {
        internalRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-stone-300 accent-[var(--accent)] focus:ring-[var(--accent)]/20",
        className,
      )}
      {...props}
    />
  );
});

export { Checkbox };
