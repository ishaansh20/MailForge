import { cn } from "../../utils/cn.js";
import { buttonVariants } from "../../styles/designSystem.js";

function Button({
  children,
  as: Element = "button",
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  leftIcon = null,
  rightIcon = null,
  type = "button",
  disabled = false,
  ...props
}) {
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-sm font-semibold",
    icon: "h-10 w-10 p-0",
  };

  const isIconOnly = size === "icon";

  const sharedClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border font-medium outline-none transition-all duration-150 ease-out focus-visible:ring-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100",
    buttonVariants[variant] || buttonVariants.primary,
    sizeClasses[size] || sizeClasses.md,
    isIconOnly && variant === "ghost"
      ? "border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] hover:border-stone-300 hover:bg-stone-50 hover:shadow-[var(--shadow-lift)]"
      : "",
    className,
  );

  if (Element === "button") {
    return (
      <button
        type={type}
        disabled={disabled || loading}
        className={sharedClassName}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!loading ? rightIcon : null}
      </button>
    );
  }

  return (
    <Element
      aria-disabled={disabled || loading ? "true" : undefined}
      className={sharedClassName}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </Element>
  );
}

export { Button };
