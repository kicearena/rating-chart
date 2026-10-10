import { describe, expect, it } from "vitest";
import { ratingHistoryChart, type RatingRecord } from "./geometry.js";
const record = (
  rating: number,
  startedAt = "2026-07-30T00:00:00.000Z",
): RatingRecord => ({ rating, startedAt });
const legacyChart = (
  history: RatingRecord[],
  width = 600,
  height = 180,
  highestRankBoundary = 0,
  startAt = "2026-01-01T00:00:00+09:00",
) =>
  ratingHistoryChart(history, {
    width,
    height,
    highestRankBoundary,
    startAt,
    minimumStart: "2026-01-01T00:00:00+09:00",
  });
describe("rating chart geometry", () => {
  it("starts at the 2026 launch and stays at zero until the first contest", () => {
    const chart = legacyChart([record(1_500)], 100, 100)!;

    expect(chart.firstDate).toBe("2025-12-31T15:00:00.000Z");
    expect(chart.tracePoints[0]).toMatchObject({
      x: 16,
      y: chart.ticks.at(-1)?.y,
    });
    expect(chart.tracePoints[1].y).toBe(chart.tracePoints[0].y);
    expect(chart.tracePoints[1].x).toBe(chart.points[0].x);
    expect(chart.tracePoints[2].y).toBe(chart.points[0].y);
    expect(chart.timeTicks).toHaveLength(2);
    expect(chart.ticks.at(-1)?.value).toBe(0);
    expect(chart.minimum).toBe(0);
    expect(chart.maximum).toBeGreaterThan(1_500);
  });

  it("spaces contests by elapsed calendar time rather than by record index", () => {
    const chart = legacyChart(
      [
        record(1_000, "2026-01-01T00:00:00+09:00"),
        record(1_200, "2026-01-02T00:00:00+09:00"),
        record(1_400, "2026-01-11T00:00:00+09:00"),
      ],
      600,
      180,
    );

    expect(chart?.points[0]?.x).toBe(16);
    expect(chart?.points[1]?.x).toBeCloseTo(72.8);
    expect(chart?.points[2]?.x).toBe(584);
    expect(chart?.timeTicks.map((tick) => tick.x)).toEqual([16, 584]);
    expect(chart?.tracePoints[3]).toMatchObject({
      x: chart?.points[1]?.x,
      y: chart?.points[0]?.y,
    });
    expect(chart?.ticks.at(-1)).toMatchObject({ value: 0 });
  });

  it("keeps the highest current rank boundary in view", () => {
    const chart = legacyChart([record(1_640)], 600, 260, 2_300);
    expect(chart?.maximum).toBe(2_500);
    expect(chart?.ticks.at(-1)?.value).toBe(0);
  });

  it("carries the previous rating into a selected start date and hides earlier contests", () => {
    const chart = legacyChart(
      [
        record(1_000, "2026-07-30T00:00:00.000Z"),
        record(1_200, "2026-08-08T00:00:00.000Z"),
      ],
      600,
      180,
      0,
      "2026-08-01T00:00:00+09:00",
    )!;

    expect(chart.firstDate).toBe("2026-07-31T15:00:00.000Z");
    expect(chart.points.map((point) => point.recordIndex)).toEqual([1]);
    expect(chart.tracePoints).toHaveLength(3);
    expect(chart.tracePoints[0].y).toBe(chart.tracePoints[1].y);
    expect(chart.tracePoints[0].y).toBeLessThan(chart.ticks.at(-1)!.y);
    expect(chart.tracePoints[0].y).toBeGreaterThan(chart.points[0].y);
  });
  it("uses the caller's epoch rather than assuming a KICE season", () => {
    const chart = ratingHistoryChart([record(1000, "2024-01-01T00:00:00Z")]);
    expect(chart?.firstDate).toBe("2024-01-01T00:00:00.000Z");
    expect(ratingHistoryChart([])).toBeNull();
  });
});
