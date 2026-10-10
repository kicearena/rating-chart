import { useState } from "react";
import { createRoot } from "react-dom/client";
import { RatingChartSvg, ratingHistoryChart } from "../src/index.js";
import "./style.css";
const records = [
  ["2025-01-01", 780],
  ["2025-02-14", 1020],
  ["2025-04-01", 920],
  ["2025-05-20", 1460],
  ["2025-07-01", 1670],
  ["2025-08-19", 1840],
  ["2025-10-05", 1720],
].map(([date, rating]) => ({
  startedAt: `${date}T00:00:00+09:00`,
  rating: Number(rating),
}));
function App() {
  const [startAt, setStart] = useState("2024-12-01");
  const chart = ratingHistoryChart(records, {
    width: 850,
    height: 340,
    startAt: `${startAt}T00:00:00+09:00`,
    joinedAt: "2024-12-01T00:00:00+09:00",
    highestRankBoundary: 2200,
  })!;
  return (
    <main>
      <small>KICE ARENA / OPEN SOURCE · MIT</small>
      <h1>A history, drawn in time.</h1>
      <p>
        Calendar-spaced line charts for prepared rating records. Drag across the
        plot to zoom into a date range, then use horizontal scroll or
        Shift+scroll to move through it; double-click to reset. Bring your own
        rating rules, bands and labels.
      </p>
      <section>
        <header>
          <h2>Synthetic rating history</h2>
          <label>
            Start date{" "}
            <input
              type="date"
              min="2024-12-01"
              max="2025-10-05"
              value={startAt}
              onChange={(e) => setStart(e.target.value || "2025-01-01")}
            />
          </label>
        </header>
        <RatingChartSvg
          chart={chart}
          aria-label="Synthetic rating history"
          bands={[
            { key: "c", minimum: 0, maximum: 1000, color: "#adc6dc" },
            { key: "b", minimum: 1000, maximum: 1600, color: "#abdce1" },
            { key: "a", minimum: 1600, maximum: 2200, color: "#b5d798" },
            {
              key: "s",
              minimum: 2200,
              maximum: chart.maximum,
              color: "#f1d37e",
            },
          ]}
          pointTitle={(i) => `Sample event ${i + 1}`}
          formatTime={(at) =>
            new Date(at + 9 * 3600000).toISOString().slice(0, 10)
          }
        />
        <p>
          {chart.points.length} visible records · {chart.tracePoints.length}{" "}
          trace coordinates
        </p>
      </section>
      <footer>
        Pure geometry export · React SVG component · ESM + TypeScript
      </footer>
    </main>
  );
}
createRoot(document.querySelector("#app")!).render(<App />);
