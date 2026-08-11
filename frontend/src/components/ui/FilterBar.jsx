function FilterBar({ children, actions = null }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export { FilterBar };
