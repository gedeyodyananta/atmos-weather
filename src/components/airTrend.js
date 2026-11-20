/**
 * Grafik tren AQI & PM2.5 24 jam dengan badge jam udara terbaik.
 * Batang AQI diwarnai per kategori; garis PM2.5 memakai skala kanan sendiri.
 */

import { t } from "../i18n/index.js";
import { buildAirQualityChart } from "../utils/airChartGeometry.js";
import { clear, el } from "../utils/dom.js";
import { formatHour, formatNumber } from "../utils/format.js";

const NS = "http://www.w3.org/2000/svg";

function svgNode(tag, attrs, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function createLegend() {
  const legend = el("div", "air-trend__legend");
  for (const [className, label] of [
    ["air-trend__swatch--aqi", t("air.aqiSeries")],
    ["air-trend__swatch--pm", t("air.pmSeries")],
  ]) {
    const item = el("span", "air-trend__legend-item");
    item.append(el("span", `air-trend__swatch ${className}`), el("span", null, label));
    legend.append(item);
  }
  return legend;
}

function createBestBadge(best) {
  if (!best) return null;
  const badge = el("div", "air-trend__best");
  badge.append(el("p", "air-trend__best-label", t("air.bestWindow")));
  badge.append(
    el(
      "p",
      "air-trend__best-value",
      t("air.bestWindowValue", {
        start: formatHour(best.startTime),
        end: formatHour(best.endTime),
      })
    )
  );
  badge.append(
    el("p", "air-trend__best-note", t("air.bestWindowNote", { value: best.averageAqi }))
  );
  badge.setAttribute(
    "aria-label",
    t("air.bestWindowAria", {
      start: formatHour(best.startTime),
      end: formatHour(best.endTime),
      value: best.averageAqi,
    })
  );
  return badge;
}

function createSvg(geometry) {
  const bestLabel = geometry.best
    ? t("air.bestWindowAria", {
        start: formatHour(geometry.best.startTime),
        end: formatHour(geometry.best.endTime),
        value: geometry.best.averageAqi,
      })
    : null;
  const peakLabel =
    geometry.peakAqi === null
      ? null
      : t("air.peak", {
          value: geometry.peakAqi,
          time: formatHour(geometry.peakTime),
        });

  const svg = svgNode("svg", {
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    class: "air-chart",
    role: "img",
    "aria-label": [bestLabel, peakLabel].filter(Boolean).join(". "),
  });

  for (const tick of geometry.aqiTicks) {
    svg.append(
      svgNode("line", {
        x1: geometry.plot.left,
        y1: tick.y,
        x2: geometry.plot.right,
        y2: tick.y,
        stroke: "var(--ink)",
        "stroke-width": 1,
        "stroke-dasharray": "2 5",
        opacity: 0.35,
      })
    );
    svg.append(
      svgNode(
        "text",
        {
          x: geometry.plot.left - 6,
          y: tick.y + 3,
          "text-anchor": "end",
          class: "air-chart__axis",
        },
        String(tick.value)
      )
    );
    svg.append(
      svgNode(
        "text",
        {
          x: geometry.plot.right + 6,
          y: tick.y + 3,
          "text-anchor": "start",
          class: "air-chart__axis air-chart__axis--pm",
        },
        String(tick.value)
      )
    );
  }

  if (geometry.best) {
    svg.append(
      svgNode("rect", {
        x: geometry.best.x,
        y: geometry.plot.top,
        width: geometry.best.width,
        height: geometry.plot.bottom - geometry.plot.top,
        class: "air-chart__best-zone",
      })
    );
  }

  for (const bar of geometry.bars) {
    if (bar.height <= 0) continue;
    const rect = svgNode("rect", {
      x: bar.x - bar.width / 2,
      y: bar.y,
      width: bar.width,
      height: bar.height,
      class: `air-chart__bar air-chart__bar--${bar.level}`,
    });
    rect.append(svgNode("title", {}, t("air.barAria", { time: formatHour(bar.time), value: bar.aqi })));
    svg.append(rect);
  }

  svg.append(
    svgNode("line", {
      x1: geometry.plot.left,
      y1: geometry.plot.bottom,
      x2: geometry.plot.right,
      y2: geometry.plot.bottom,
      stroke: "var(--ink)",
      "stroke-width": 2,
    })
  );

  if (geometry.pmPoints.length > 1) {
    svg.append(
      svgNode("path", {
        d: geometry.linePath,
        fill: "none",
        stroke: "var(--violet)",
        "stroke-width": 3,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      })
    );
  }

  for (const point of geometry.pmPoints) {
    const circle = svgNode("circle", {
      cx: point.x,
      cy: point.y,
      r: 3.5,
      fill: "var(--paper)",
      stroke: "var(--violet)",
      "stroke-width": 2,
    });
    circle.append(svgNode("title", {}, `PM2.5 ${formatNumber(point.value, 1)} µg/m³`));
    svg.append(circle);
  }

  const labelIndexes = new Set([0, 4, 8, 12, 16, 20, geometry.bars.length - 1]);
  for (const index of labelIndexes) {
    const bar = geometry.bars[index];
    if (!bar) continue;
    svg.append(
      svgNode(
        "text",
        {
          x: bar.x,
          y: geometry.height - 10,
          "text-anchor": "middle",
          class: "air-chart__axis",
        },
        formatHour(bar.time)
      )
    );
  }

  return svg;
}

export function createAirTrend() {
  const element = el("section", "panel air-trend-panel");
  element.setAttribute("aria-labelledby", "air-trend-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("air.trendTitle"));
    title.id = "air-trend-title";
    head.append(title, createLegend());
    element.append(head);

    const geometry = buildAirQualityChart(view.airHourly, { width: 480, height: 220 });
    if (!geometry) {
      element.append(el("p", "panel__empty", t("air.trendEmpty")));
      return;
    }

    const top = el("div", "air-trend__top");
    top.append(createSvg(geometry));
    const best = createBestBadge(geometry.best);
    if (best) top.append(best);
    element.append(top);

    if (geometry.peakAqi !== null) {
      element.append(
        el(
          "p",
          "air-trend__peak",
          t("air.peak", {
            value: geometry.peakAqi,
            time: formatHour(geometry.peakTime),
          })
        )
      );
    }
  }

  return { element, update };
}
