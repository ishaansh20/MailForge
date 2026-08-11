import { Link } from "react-router-dom";

function Breadcrumbs({ items = [] }) {
  if (!items.length) {
    return (
      <span className="text-sm text-stone-400">Breadcrumb placeholder</span>
    );
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm text-stone-500"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-stone-300">/</span> : null}
            {isLast || !item.to ? (
              <span className={isLast ? "font-medium text-stone-950" : ""}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="transition hover:text-stone-950">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export { Breadcrumbs };
