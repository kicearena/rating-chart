import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RatingChartSvg, ratingHistoryChart } from "./index.js";
describe("SVG presentation", () => {
  it("renders prepared bands, axes, step trace and record labels", () => {
    const chart = ratingHistoryChart([
      { rating: 800, startedAt: "2024-01-01T00:00:00Z" },
      { rating: 1200, startedAt: "2024-02-01T00:00:00Z" },
    ])!;
    const html = renderToStaticMarkup(
      <RatingChartSvg
        chart={chart}
        aria-label="Synthetic rating history"
        bands={[{ key: "band", minimum: 0, maximum: 1500, color: "#eeeeee" }]}
        pointTitle={(index) => `Record ${index + 1}`}
        formatTime={(at) => new Date(at).toISOString().slice(0, 10)}
      />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain("Synthetic rating history");
    expect(html).toContain("Record 1");
    expect(html).toContain("Record 2");
    expect(html).toContain('class="trace"');
    expect(html).toContain('fill="#eeeeee"');
    expect((html.match(/<circle/g) ?? []).length).toBe(2);
  });
});
