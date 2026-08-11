import { useId, useState } from "react";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING_X = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function buildSmoothPath(points) {
  if (points.length < 2) {
    return "";
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function SubscriberGrowthChart({ data }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState(null);

  const maxValue = Math.max(1, ...data.map((point) => point.count));
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = data.map((point, index) => ({
    x: PADDING_X + (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth),
    y: PADDING_TOP + plotHeight - (point.count / maxValue) * plotHeight,
    month: point.month,
    count: point.count,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath =
    linePath && points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${PADDING_TOP + plotHeight} L ${points[0].x} ${PADDING_TOP + plotHeight} Z`
      : "";

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ height: `${HEIGHT}px` }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((fraction) => (
            <line
              key={fraction}
              x1={PADDING_X}
              x2={WIDTH - PADDING_X}
              y1={PADDING_TOP + plotHeight * fraction}
              y2={PADDING_TOP + plotHeight * fraction}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
          {linePath ? (
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          ) : null}

          {points.map((point, index) => (
            <circle
              key={point.month}
              cx={point.x}
              cy={point.y}
              r={hoverIndex === index ? 5 : 3.5}
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150 ease-out"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
            />
          ))}
        </svg>

        {hoverIndex !== null ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-[var(--shadow-lift)]"
            style={{
              left: `${(points[hoverIndex].x / WIDTH) * 100}%`,
              top: `${(points[hoverIndex].y / HEIGHT) * 100}%`,
              marginTop: "-10px",
            }}
          >
            <p className="font-semibold text-stone-950">{formatMonthLabel(points[hoverIndex].month)}</p>
            <p className="text-stone-500">{points[hoverIndex].count.toLocaleString()} subscribers</p>
          </div>
        ) : null}
      </div>

      <div className="flex justify-between px-1">
        {data.map((point) => (
          <span key={point.month} className="text-[10px] font-medium text-stone-400">
            {formatMonthLabel(point.month)}
          </span>
        ))}
      </div>
    </div>
  );
}

export { SubscriberGrowthChart };
