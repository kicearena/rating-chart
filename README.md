# @kicearena/rating-chart

Calendar-spaced line chart geometry and an accessible React SVG renderer for **already-calculated rating histories**.

[MIT](LICENSE) · ESM + TypeScript · Pure geometry / React 19 · [![npm version](https://img.shields.io/npm/v/%40kicearena%2Frating-chart)](https://www.npmjs.com/package/@kicearena/rating-chart)

![Rating chart example](docs/images/preview.png)

## Use

Install directly from the public npm registry:

```sh
npm install --save-exact @kicearena/rating-chart@0.1.1
# or
bun add --exact @kicearena/rating-chart@0.1.1
```

```tsx
import { ratingHistoryChart, RatingChartSvg } from "@kicearena/rating-chart";
const history = [{ startedAt: "2025-01-01T00:00:00Z", rating: 1200 }];
const chart = ratingHistoryChart(history, {
  width: 600,
  height: 260,
  joinedAt: "2025-01-01T00:00:00Z",
});
// If chart is non-null:
<RatingChartSvg
  chart={chart!}
  aria-label="Rating history"
  pointTitle={(index) => `Event ${index + 1}`}
  formatTime={(at) => new Date(at).toISOString().slice(0, 10)}
/>;
```

`@kicearena/rating-chart/geometry` has no React runtime import. Input records are chronological `{startedAt, rating}` values. `joinedAt` anchors the chart's first date and zero-rating baseline; straight line segments connect the starting point and each contest record. `recordIndex` maps visible points back to the original records. A selected start date carries the preceding rating into the trace; `endAt` can cap the range. An empty history returns null. Coordinates follow elapsed time rather than array indices. Calendar ticks use KST month boundaries; crowded date labels are omitted to prevent collisions while preserving the selected period's first and last labels. Drag across the plot to select a time range, then use horizontal scroll or Shift+scroll to pan through that range; double-click or use the reset control to return to the full range. Hover or keyboard focus on a point shows its event title, rating, change from the preceding record, and formatted date with a vertical guide; points retain native SVG titles as well. `renderTooltip` can replace the default contents with host-provided React content such as contest rank or links. The tooltip stays open while the pointer moves into it and closes after a short exit delay.

Options: `width`, `height`, `joinedAt`, `startAt`, `endAt`, `highestRankBoundary`. The package contains no fixed signup date, rating formula, rank thresholds, account/API access or fetch. `RatingChartSvg` receives prepared `{key,minimum,maximum,color}` bands and label functions; resize observation and explicit date inputs stay in the host.

## Showcase and development

```sh
bun install --frozen-lockfile
bun run demo
bun run check
bun run test
bun run build
bun run demo:build
```

The editable showcase uses synthetic records. Tests preserve the original time spacing, zero baseline, selected-period carry, rank-boundary extent and SVG markup. Publish an immutable exact version with a matching `v<version>` tag.

## License

[MIT](LICENSE) © 2026 KICE Arena contributors.
