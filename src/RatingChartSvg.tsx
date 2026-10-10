import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SVGProps,
  type Ref,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { ratingHistoryChart, type RatingChart } from "./geometry.js";
export type RatingChartBand = {
  key: string;
  minimum: number;
  maximum: number;
  color: string;
};
export type RatingChartTooltipContext = {
  at: number;
  delta: number;
  pointIndex: number;
  pointTitle: string;
  rating: number;
  recordIndex: number;
};
export function RatingChartSvg({
  chart: inputChart,
  bands = [],
  pointTitle,
  formatTime,
  formatValue = (value) => value.toLocaleString(),
  renderTooltip,
  ref,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children"> & {
  chart: RatingChart;
  bands?: readonly RatingChartBand[];
  pointTitle: (recordIndex: number) => string;
  formatTime: (at: number, index: number) => string;
  formatValue?: (value: number) => string;
  renderTooltip?: (context: RatingChartTooltipContext) => ReactNode;
  ref?: Ref<SVGSVGElement>;
}) {
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const inputRange = useRef({
    firstDate: inputChart.firstDate,
    lastDate: inputChart.lastDate,
    sourceHistory: inputChart.sourceHistory,
  });
  useEffect(() => {
    const nextRange = {
      firstDate: inputChart.firstDate,
      lastDate: inputChart.lastDate,
      sourceHistory: inputChart.sourceHistory,
    };
    if (
      inputRange.current.firstDate !== nextRange.firstDate ||
      inputRange.current.lastDate !== nextRange.lastDate ||
      inputRange.current.sourceHistory !== nextRange.sourceHistory
    ) {
      inputRange.current = nextRange;
      setZoomRange(null);
      setSelection(null);
    }
  }, [inputChart.firstDate, inputChart.lastDate, inputChart.sourceHistory]);
  const chart = zoomRange
    ? (ratingHistoryChart(inputChart.sourceHistory, {
        width: inputChart.width,
        height: inputChart.height,
        joinedAt: inputChart.joinedAt,
        highestRankBoundary: inputChart.highestRankBoundary,
        startAt: new Date(zoomRange[0]).toISOString(),
        endAt: new Date(zoomRange[1]).toISOString(),
      }) ?? inputChart)
    : inputChart;
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  const openPoint = (recordIndex: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setActivePoint(recordIndex);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActivePoint(null), 240);
  };
  const pointerX = (event: ReactPointerEvent<SVGGraphicsElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return 16;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse()).x;
  };
  const timeForX = (x: number) => {
    const ratio = Math.max(
      0,
      Math.min(1, (x - 16) / Math.max(1, chart.width - 32)),
    );
    return (
      Date.parse(chart.firstDate) +
      ratio * (Date.parse(chart.lastDate) - Date.parse(chart.firstDate))
    );
  };
  const beginSelection = (event: ReactPointerEvent<SVGGraphicsElement>) => {
    const x = pointerX(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelection([x, x]);
  };
  const moveSelection = (event: ReactPointerEvent<SVGGraphicsElement>) => {
    if (!selection) return;
    setSelection([selection[0], pointerX(event)]);
  };
  const finishSelection = (event: ReactPointerEvent<SVGGraphicsElement>) => {
    if (!selection) return;
    const x = pointerX(event);
    const low = Math.min(selection[0], x);
    const high = Math.max(selection[0], x);
    if (high - low >= 12) setZoomRange([timeForX(low), timeForX(high)]);
    setSelection(null);
  };
  const panRange = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (!zoomRange) return;
    const pixels = event.deltaX || (event.shiftKey ? event.deltaY : 0);
    if (!pixels) return;
    event.preventDefault();
    const rangeStart = Date.parse(inputChart.firstDate);
    const rangeEnd = Date.parse(inputChart.lastDate);
    const duration = zoomRange[1] - zoomRange[0];
    const offset = (pixels / Math.max(1, chart.width - 32)) * duration;
    const nextStart = Math.max(
      rangeStart,
      Math.min(rangeEnd - duration, zoomRange[0] + offset),
    );
    setZoomRange([nextStart, nextStart + duration]);
  };
  const active = chart.points.find(
    (point) => point.recordIndex === activePoint,
  );
  const plotTop = chart.ticks[0].y;
  const plotBottom = chart.ticks[chart.ticks.length - 1].y;
  const tooltipX = active
    ? Math.min(chart.width - 190, Math.max(20, active.x + 12))
    : 0;
  const tooltipY = active ? Math.max(plotTop + 4, active.y - 48) : 0;
  const labeledTimeTicks = new Set<number>();
  if (chart.timeTicks.length === 1) {
    labeledTimeTicks.add(0);
  } else if (chart.timeTicks.length > 1) {
    const lastIndex = chart.timeTicks.length - 1;
    const firstTick = chart.timeTicks[0]!;
    const lastTick = chart.timeTicks[lastIndex]!;
    if (lastTick.x - firstTick.x >= 100) {
      labeledTimeTicks.add(0);
      labeledTimeTicks.add(lastIndex);
      let previousLabeledX = firstTick.x;
      chart.timeTicks.forEach((tick, index) => {
        if (
          index > 0 &&
          index < lastIndex &&
          tick.x - previousLabeledX >= 100 &&
          lastTick.x - tick.x >= 100
        ) {
          labeledTimeTicks.add(index);
          previousLabeledX = tick.x;
        }
      });
    } else {
      labeledTimeTicks.add(lastIndex);
    }
  }
  return (
    <svg
      ref={ref}
      {...props}
      onWheel={panRange}
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
            <text
              fill="#888b7d"
              fontSize={10}
              textAnchor="end"
              x="10"
              y={tick.y + 3}
            >
              {formatValue(tick.value)}
            </text>
          </g>
        ))}
      </g>
      <g className="time-ticks">
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
            {labeledTimeTicks.has(index) ? (
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
            ) : (
              <title>{formatTime(tick.at, index)}</title>
            )}
          </g>
        ))}
      </g>
      <rect
        x="16"
        y={plotTop}
        width={chart.width - 32}
        height={plotBottom - plotTop}
        fill="transparent"
        cursor="crosshair"
        onPointerDown={beginSelection}
        onPointerMove={moveSelection}
        onPointerUp={finishSelection}
        onPointerCancel={() => setSelection(null)}
        onDoubleClick={() => setZoomRange(null)}
      />
      {selection && (
        <rect
          x={Math.min(selection[0], selection[1])}
          y={plotTop}
          width={Math.abs(selection[1] - selection[0])}
          height={plotBottom - plotTop}
          fill="#6f91b8"
          opacity=".2"
          pointerEvents="none"
        />
      )}
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
            tabIndex={0}
            role="graphics-symbol"
            aria-label={`${formatTime(point.at, index)} · ${formatValue(point.rating)} · ${pointTitle(point.recordIndex)}`}
            onPointerDown={(event) => beginSelection(event)}
            onPointerMove={(event) => moveSelection(event)}
            onPointerUp={(event) => finishSelection(event)}
            onPointerEnter={() => openPoint(point.recordIndex)}
            onPointerLeave={scheduleClose}
            onFocus={() => openPoint(point.recordIndex)}
            onBlur={scheduleClose}
          >
            <title>{pointTitle(point.recordIndex)}</title>
          </circle>
        </g>
      ))}
      {zoomRange && (
        <g
          role="button"
          tabIndex={0}
          aria-label="전체 기간 보기"
          cursor="pointer"
          onClick={() => setZoomRange(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setZoomRange(null);
            }
          }}
        >
          <rect
            x={chart.width - 88}
            y="2"
            width="84"
            height="18"
            rx="4"
            fill="#f2f0e8"
          />
          <text
            x={chart.width - 46}
            y="15"
            textAnchor="middle"
            fill="#626456"
            fontSize="10"
          >
            전체 기간 보기
          </text>
        </g>
      )}
      {active && (
        <g
          className="rating-chart-tooltip"
          onPointerEnter={() => openPoint(active.recordIndex)}
          onPointerLeave={scheduleClose}
        >
          <line
            x1={active.x}
            x2={active.x}
            y1={plotTop}
            y2={plotBottom}
            stroke="#8b7044"
            strokeDasharray="3 3"
            opacity=".65"
          />
          <rect
            x={tooltipX}
            y={tooltipY}
            width="178"
            height="58"
            rx="5"
            fill="#20231f"
            opacity=".94"
          />
          {renderTooltip ? (
            <foreignObject
              x={tooltipX + 7}
              y={tooltipY + 5}
              width="164"
              height="48"
              overflow="visible"
            >
              <div>
                {renderTooltip({
                  at: active.at,
                  delta: active.delta,
                  pointIndex: chart.points.indexOf(active),
                  pointTitle: pointTitle(active.recordIndex),
                  rating: active.rating,
                  recordIndex: active.recordIndex,
                })}
              </div>
            </foreignObject>
          ) : (
            <>
              <text
                x={tooltipX + 9}
                y={tooltipY + 16}
                fill="#fff"
                fontSize="11"
              >
                {pointTitle(active.recordIndex)}
              </text>
              <text
                x={tooltipX + 9}
                y={tooltipY + 31}
                fill="#fff"
                fontSize="11"
              >
                {formatValue(active.rating)}
                <tspan fill={active.delta >= 0 ? "#a8e1ad" : "#ffaaaa"}>
                  {`  ${active.delta > 0 ? "+" : ""}${formatValue(active.delta)}`}
                </tspan>
              </text>
              <text
                x={tooltipX + 9}
                y={tooltipY + 49}
                fill="#d2d5cd"
                fontSize="10"
              >
                {formatTime(active.at, chart.points.indexOf(active))}
              </text>
            </>
          )}
        </g>
      )}
    </svg>
  );
}
