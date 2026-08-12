function Tooltip({ label, children }) {
  return (
    <span className="group relative block">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 shadow-[var(--shadow-soft)] group-hover:block">
        {label}
      </span>
    </span>
  );
}

export { Tooltip };
