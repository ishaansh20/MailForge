import { cn } from "../../utils/cn.js";
import { badgeVariants } from "../../styles/designSystem.js";

function Badge({ children, variant = "neutral", className = "", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        badgeVariants[variant] || badgeVariants.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
