import type { SVGProps, Ref } from "react";
import type { RatingChart } from "./geometry.js";
export type RatingChartBand = {
  key: string;
  minimum: number;
  maximum: number;
  color: string;
};
export function RatingChartSvg({
  chart,
  bands = [],
  pointTitle,
  formatTime,
  formatValue = (value) => value.toLocaleString(),
  ref,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children"> & {
  chart: RatingChart;
  bands?: readonly RatingChartBand[];
  pointTitle: (recordIndex: number) => string;
  formatTime: (at: number, index: number) => string;
  formatValue?: (value: number) => string;
  ref?: Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={ref}
      {...props}
      viewBox={`-34 0 ${chart.width + 34} ${chart.height}`}
      role="img"
    >
      <g className="rank-bands" aria-hidden="true">
        {bands.map((band) => {
          const low = band.minimum;
          const high = Math.min(chart.maximum, band.maximum);
          if (low >= chart.maximum || high <= low) return null;
          const plotTop = chart.ticks[0].y;
          const plotHeight = chart.ticks[chart.ticks.length - 1].y - plotTop;
          const y =
            plotTop + ((chart.maximum - high) / chart.maximum) * plotHeight;
          const height = ((high - low) / chart.maximum) * plotHeight;
          return (
            <g key={band.key}>
              <rect
                opacity={0.3}
                x="16"
                y={y}
                width={chart.width - 32}
                height={height}
                fill={band.color}
              />
            </g>
          );
        })}
      </g>
      <g className="rating-ticks">
        {chart.ticks.map((tick) => (
          <g key={tick.value}>
            <line
              className="grid"
              stroke="#e0e2d6"
              strokeWidth={1}
              x1="16"
              x2={chart.width - 16}
              y1={tick.y}
              y2={tick.y}
            />
            <text fill="#888b7d" fontSize={10} x="-8" y={tick.y - 4}>
              {formatValue(tick.value)}
            </text>
          </g>
        ))}
      </g>
      <g className="time-ticks" aria-hidden="true">
        {chart.timeTicks.map((tick, index) => (
          <g key={tick.at}>
            {index > 0 && index < chart.timeTicks.length - 1 && (
              <line
                className="time-grid"
                stroke="#e0e2d6"
                strokeDasharray="3 5"
                strokeWidth={1}
                x1={tick.x}
                x2={tick.x}
                y1={chart.ticks[0].y}
                y2={chart.ticks[chart.ticks.length - 1].y}
              />
            )}
            <text
              fill="#888b7d"
              fontSize={10}
              x={tick.x}
              y={chart.height - 3}
              textAnchor={
                index === 0
                  ? "start"
                  : index === chart.timeTicks.length - 1
                    ? "end"
                    : "middle"
              }
            >
              {formatTime(tick.at, index)}
            </text>
          </g>
        ))}
      </g>
      <polyline
        className="trace"
        fill="none"
        stroke="#a87420"
        strokeWidth={2.5}
        points={chart.tracePoints
          .map((point) => `${point.x},${point.y}`)
          .join(" ")}
      />
      {chart.points.map((point, index) => (
        <g key={point.recordIndex}>
          <circle
            fill="#ffdf81"
            stroke="#9b691b"
            strokeWidth={index === chart.points.length - 1 ? 2 : 1.5}
            className={
              index === chart.points.length - 1 ? "is-current" : undefined
            }
            cx={point.x}
            cy={point.y}
            r={index === chart.points.length - 1 ? 4 : 2.5}
          >
            <title>{pointTitle(point.recordIndex)}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}
