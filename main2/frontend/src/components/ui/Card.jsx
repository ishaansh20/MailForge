import { cn } from "../../utils/cn.js";

function Card({ children, className = "", ...props }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-soft)] transition-shadow duration-200 ease-out",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

function CardHeader({ children, className = "", ...props }) {
  return (
    <header
      className={cn("border-b border-stone-200 px-6 py-4", className)}
      {...props}
    >
      {children}
    </header>
  );
}

function CardContent({ children, className = "", ...props }) {
  return (
    <div className={cn("px-6 py-6", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = "", ...props }) {
  return (
    <footer
      className={cn("border-t border-stone-200 px-6 py-4", className)}
      {...props}
    >
      {children}
    </footer>
  );
}

export { Card, CardHeader, CardContent, CardFooter };
