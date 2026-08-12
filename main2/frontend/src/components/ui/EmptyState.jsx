import { Button } from "./Button.jsx";

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = null,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-10 text-center shadow-[var(--shadow-soft)]">
      {icon ? (
        <div className="mb-4 flex justify-center text-stone-400">{icon}</div>
      ) : null}
      <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      {actionLabel ? (
        <div className="mt-6">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { EmptyState };
