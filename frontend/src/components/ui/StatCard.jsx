import { Card, CardContent } from "./Card.jsx";
import { Icon } from "./Icon.jsx";

function StatCard({ title, value, changePercent, icon, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-stone-700 text-white",
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-500 text-white",
    danger: "bg-rose-500 text-white",
    info: "bg-sky-500 text-white",
    accent: "bg-[var(--accent)] text-white",
  };

  const hasTrend = typeof changePercent === "number";
  const isPositive = changePercent >= 0;

  return (
    <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${toneClasses[tone]}`}
          >
            <Icon name={icon} size={14} />
          </div>
          <p className="truncate text-sm font-medium text-stone-600">{title}</p>
        </div>

        <p className="text-3xl font-semibold tracking-tight text-stone-950">{value}</p>

        {hasTrend ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">vs last month</span>
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              <Icon name={isPositive ? "trendUp" : "trendDown"} size={10} />
              {Math.abs(changePercent)}%
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { StatCard };
