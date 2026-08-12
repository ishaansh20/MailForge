import { Icon } from "./Icon.jsx";
import { cn } from "../../utils/cn.js";

function Stepper({ steps, currentStep }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-150 ease-out",
                  isComplete
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : isCurrent
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-stone-200 text-stone-400",
                )}
              >
                {isComplete ? <Icon name="check" size={14} /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isCurrent ? "text-stone-950" : isComplete ? "text-stone-700" : "text-stone-400",
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1",
                  isComplete ? "bg-[var(--accent)]" : "bg-stone-200",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
