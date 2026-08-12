import { Button } from "./Button.jsx";

function ErrorState({
  title = "Something went wrong",
  description,
  actionLabel = "Try again",
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
      <h3 className="text-lg font-semibold text-rose-900">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
      ) : null}
      {onAction ? (
        <div className="mt-6">
          <Button variant="danger" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { ErrorState };
