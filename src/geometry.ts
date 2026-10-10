export type RatingChartPoint = {
  x: number;
  y: number;
  at: number;
  rating: number;
  previousRating: number;
  delta: number;
  recordIndex: number;
};

export type RatingChartTick = {
  value: number;
  y: number;
};

export type RatingChartTimeTick = {
  at: number;
  x: number;
};

export type RatingChart = {
  width: number;
  height: number;
  points: RatingChartPoint[];
  tracePoints: Pick<RatingChartPoint, "x" | "y">[];
  ticks: RatingChartTick[];
  timeTicks: RatingChartTimeTick[];
  minimum: number;
  maximum: number;
  firstDate: string;
  lastDate: string;
  sourceHistory: readonly RatingRecord[];
  joinedAt: string;
  highestRankBoundary: number;
};

const chartPadding = {
  top: 16,
  right: 16,
  bottom: 24,
  left: 16,
};

const chartTickStep = (maximumRating: number) => {
  const roughStep = Math.max(100, maximumRating / 5);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  return (
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude
  );
};

const chartTimeTicks = (
  firstTime: number,
  lastTime: number,
  plotWidth: number,
  xForTime: (at: number) => number,
): RatingChartTimeTick[] => {
  if (firstTime === lastTime)
    return [{ at: firstTime, x: xForTime(firstTime) }];
  const maxTicks = Math.min(Math.max(2, Math.floor(plotWidth / 95) + 1), 5);
  const koreaOffsetMs = 9 * 60 * 60 * 1_000;
  const firstLocal = new Date(firstTime + koreaOffsetMs);
  const lastLocal = new Date(lastTime + koreaOffsetMs);
  const firstMonth =
    firstLocal.getUTCFullYear() * 12 + firstLocal.getUTCMonth();
  const lastMonth = lastLocal.getUTCFullYear() * 12 + lastLocal.getUTCMonth();
  const monthSpan = lastMonth - firstMonth;
  const monthStep = Math.max(1, Math.ceil((monthSpan + 1) / (maxTicks - 1)));
  const ticks = [firstTime];
  for (
    let month = firstMonth + monthStep;
    month <= lastMonth;
    month += monthStep
  ) {
    const at = Date.UTC(Math.floor(month / 12), month % 12, 1) - koreaOffsetMs;
    if (at > firstTime && at < lastTime) ticks.push(at);
  }
  ticks.push(lastTime);
  return ticks.map((at) => ({ at, x: xForTime(at) }));
};

export type RatingRecord = { startedAt: string; rating: number };
export type RatingChartOptions = {
  width?: number;
  height?: number;
  highestRankBoundary?: number;
  joinedAt?: string;
  startAt?: string;
  endAt?: string;
};
export const ratingHistoryChart = (
  history: readonly RatingRecord[],
  {
    width = 600,
    height = 180,
    highestRankBoundary = 0,
    joinedAt,
    startAt = joinedAt,
    endAt,
  }: RatingChartOptions = {},
): RatingChart | null => {
  if (history.length === 0) return null;

  const timestamps = history.map((record) => Date.parse(record.startedAt));
  const lastTime = Math.max(...timestamps);
  const requestedStart = startAt
    ? Date.parse(startAt)
    : Math.min(...timestamps);
  const joinedTime = joinedAt ? Date.parse(joinedAt) : Math.min(...timestamps);
  const firstTime = Math.min(
    lastTime,
    Math.max(
      joinedTime,
      Number.isFinite(requestedStart) ? requestedStart : joinedTime,
    ),
  );
  const requestedEnd = endAt ? Date.parse(endAt) : lastTime;
  const visibleEndTime = Math.max(
    firstTime,
    Number.isFinite(requestedEnd) ? requestedEnd : lastTime,
  );
  const visibleRecords = history.flatMap((record, recordIndex) =>
    timestamps[recordIndex] >= firstTime &&
    timestamps[recordIndex] <= visibleEndTime
      ? [{ record, recordIndex }]
      : [],
  );
  const ratingAtStart = history.reduce(
    (rating, record, index) =>
      timestamps[index] < firstTime ? record.rating : rating,
    0,
  );
  const maximumRating = Math.max(
    highestRankBoundary,
    ratingAtStart,
    ...visibleRecords.map(({ record }) => record.rating),
  );
  const tickStep = chartTickStep(maximumRating);
  const minimum = 0;
  const maximum = Math.max(
    tickStep,
    Math.ceil((maximumRating * 1.04) / tickStep) * tickStep,
  );
  const plotWidth = width - chartPadding.left - chartPadding.right;
  const plotHeight = height - chartPadding.top - chartPadding.bottom;
  const xForTime = (at: number) =>
    firstTime === visibleEndTime
      ? chartPadding.left + plotWidth / 2
      : chartPadding.left +
        ((at - firstTime) / (visibleEndTime - firstTime)) * plotWidth;
  const yForRating = (rating: number) =>
    chartPadding.top + ((maximum - rating) / maximum) * plotHeight;
  let previousRating = ratingAtStart;
  const points = visibleRecords.map(({ record, recordIndex }) => {
    const point = {
      x: xForTime(timestamps[recordIndex]),
      y: yForRating(record.rating),
      at: timestamps[recordIndex],
      rating: record.rating,
      previousRating,
      delta: record.rating - previousRating,
      recordIndex,
    };
    previousRating = record.rating;
    return point;
  });
  const tracePoints = [
    { x: xForTime(firstTime), y: yForRating(ratingAtStart) },
    ...points.map(({ x, y }) => ({ x, y })),
  ];
  const lastPoint = points.at(-1);
  if (!lastPoint || lastPoint.at < visibleEndTime) {
    tracePoints.push({
      x: xForTime(visibleEndTime),
      y: yForRating(lastPoint?.rating ?? ratingAtStart),
    });
  }

  return {
    width,
    height,
    points,
    tracePoints,
    ticks: Array.from({ length: maximum / tickStep + 1 }, (_, index) => {
      const value = maximum - index * tickStep;
      return { value, y: yForRating(value) };
    }),
    timeTicks: chartTimeTicks(firstTime, visibleEndTime, plotWidth, xForTime),
    minimum,
    maximum,
    firstDate: new Date(firstTime).toISOString(),
    lastDate: new Date(visibleEndTime).toISOString(),
    sourceHistory: history,
    joinedAt: new Date(joinedTime).toISOString(),
    highestRankBoundary,
  };
};
