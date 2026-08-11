function Loader({ label = "Loading", className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-sm text-stone-500 ${className}`}
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-r-stone-950" />
      <span>{label}</span>
    </div>
  );
}

export { Loader };
