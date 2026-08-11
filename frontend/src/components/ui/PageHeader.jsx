import { Breadcrumbs } from "./Breadcrumbs.jsx";
import { Button } from "./Button.jsx";

function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions = null,
  metadata = null,
}) {
  return (
    <header className="space-y-4">
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-2xl text-sm leading-6 text-stone-500">
              {subtitle}
            </p>
          ) : null}
          {metadata ? (
            <div className="text-sm text-stone-400">{metadata}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

function PageActionButton({ children, ...props }) {
  return <Button {...props}>{children}</Button>;
}

export { PageHeader, PageActionButton };
