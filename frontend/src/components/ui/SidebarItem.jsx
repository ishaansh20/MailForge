import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { Icon } from "./Icon.jsx";
import { Tooltip } from "./Tooltip.jsx";

function SidebarItem({
  to,
  label,
  icon,
  disabled = false,
  collapsed = false,
  comingSoon = false,
  onClick,
}) {
  const baseClasses = cn(
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out",
    disabled ? "cursor-not-allowed text-stone-400" : "",
  );

  function renderContent(isActive) {
    return (
      <>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition-colors duration-150 ease-out",
            isActive
              ? "text-white"
              : "bg-transparent text-stone-500 group-hover:border-stone-200 group-hover:bg-white group-hover:text-stone-950",
          )}
        >
          <Icon name={icon} size={18} />
        </span>
        {!collapsed ? (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">{label}</span>
            {comingSoon ? (
              <span className="text-xs font-medium text-stone-400">Soon</span>
            ) : null}
          </span>
        ) : null}
      </>
    );
  }

  if (disabled) {
    return (
      <Tooltip label={comingSoon ? `${label} coming soon` : label}>
        <button
          type="button"
          className={baseClasses}
          onClick={onClick}
          aria-disabled="true"
        >
          {renderContent(false)}
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={collapsed ? label : ""}>
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            baseClasses,
            isActive
              ? "bg-[var(--accent)] text-white shadow-[0_1px_2px_rgba(234,88,12,0.25)] hover:bg-[var(--accent)] hover:text-white"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
          )
        }
      >
        {({ isActive }) => renderContent(isActive)}
      </NavLink>
    </Tooltip>
  );
}

export { SidebarItem };
