import { cn } from "../../utils/cn.js";

function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[length:200%_100%] bg-gradient-to-r from-stone-200/70 via-stone-100 to-stone-200/70 [animation:ems-shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
