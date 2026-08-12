import { Tooltip } from "../../components/ui/Tooltip.jsx";

const CHART_HEIGHT = 160;

function formatShortDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function barHeight(value, maxValue) {
  if (value <= 0) {
    return 0;
  }

  return Math.max(4, Math.round((value / maxValue) * CHART_HEIGHT));
}

function SendsOverTimeChart({ data }) {
  const maxValue = Math.max(1, ...data.map((day) => Math.max(day.sent, day.failed)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
          Failed
        </span>
      </div>

      <div
        className="flex items-end gap-2 border-b border-stone-200"
        style={{ height: `${CHART_HEIGHT}px` }}
      >
        {data.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 items-end justify-center">
            <Tooltip label={`${formatShortDate(day.date)}: ${day.sent} sent, ${day.failed} failed`}>
              <div className="flex items-end gap-[2px]">
                <div
                  className="w-[10px] rounded-t bg-emerald-500 transition hover:bg-emerald-600"
                  style={{ height: `${barHeight(day.sent, maxValue)}px` }}
                />
                <div
                  className="w-[10px] rounded-t bg-rose-500 transition hover:bg-rose-600"
                  style={{ height: `${barHeight(day.failed, maxValue)}px` }}
                />
              </div>
            </Tooltip>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {data.map((day) => (
          <div key={day.date} className="min-w-0 flex-1 truncate text-center text-[10px] text-stone-400">
            {formatShortDate(day.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { SendsOverTimeChart };
