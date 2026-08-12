import { Link } from "react-router-dom";
import { cn } from "../../utils/cn.js";

function NavbarItem({
  to,
  children,
  onClick,
  className = "",
  disabled = false,
}) {
  const baseClasses = cn(
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
    disabled
      ? "cursor-not-allowed text-stone-400"
      : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
    className,
  );

  if (disabled) {
    return (
      <button type="button" className={baseClasses} disabled>
        {children}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={baseClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {children}
    </button>
  );
}

export { NavbarItem };
