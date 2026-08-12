import { cn } from "../../utils/cn.js";

function Avatar({ name = "", imageUrl = "", size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-sm",
  };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-1 ring-stone-200",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-100 font-semibold text-stone-700",
        sizeClasses[size],
        className,
      )}
    >
      {initials || "U"}
    </div>
  );
}

export { Avatar };
