import { forwardRef, useId } from "react";
import { cn } from "../../utils/cn.js";
import { inputVariants } from "../../styles/designSystem.js";

const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    helperText,
    className = "",
    leftIcon = null,
    rightIcon = null,
    disabled = false,
    containerClassName = "",
    labelClassName = "",
    descriptionClassName = "",
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const variant = disabled ? "disabled" : error ? "error" : "default";

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn("text-sm font-medium text-stone-700", labelClassName)}
        >
          {label}
        </label>
      ) : null}
      <span className="relative block">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          disabled={disabled}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none transition-all duration-150 ease-out focus:ring-4",
            leftIcon ? "pl-10" : "",
            rightIcon ? "pr-10" : "",
            inputVariants[variant],
            className,
          )}
          {...props}
        />
        {rightIcon ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-stone-400">
            {rightIcon}
          </span>
        ) : null}
      </span>
      {error ? (
        <p id={errorId} className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      {!error && helperText ? (
        <p
          id={helperId}
          className={cn("text-sm text-stone-500", descriptionClassName)}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export { Input };
