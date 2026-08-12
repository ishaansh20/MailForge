import { cn } from "../../utils/cn.js";

function Table({ children, className = "", ...props }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <table className="min-w-full divide-y divide-stone-200" {...props}>
        {children}
      </table>
    </div>
  );
}

function TableHead({ children, className = "", ...props }) {
  return (
    <thead
      className={cn(
        "bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500",
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

function TableBody({ children, className = "", ...props }) {
  return (
    <tbody
      className={cn(
        "divide-y divide-stone-200 bg-white text-sm text-stone-600",
        className,
      )}
      {...props}
    >
      {children}
    </tbody>
  );
}

function TableRow({ children, className = "", ...props }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-150 ease-out hover:bg-stone-100",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

function TableHeaderCell({ children, className = "", ...props }) {
  return (
    <th
      className={cn("px-4 py-3 font-semibold text-stone-500", className)}
      {...props}
    >
      {children}
    </th>
  );
}

function TableCell({ children, className = "", ...props }) {
  return (
    <td className={cn("px-4 py-4 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell };
