/**
 * Grafik tren 24 jam (SPEC F8) sebagai SVG native tanpa dependency.
 * Menampilkan garis suhu + feels-like dan bar probabilitas hujan.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import { formatHour, formatNumber } from "../utils/format.js";
import { buildTemperatureChart } from "../utils/chartGeometry.js";

const NS = "http://www.w3.org/2000/svg";

function svgNode(tag, attrs, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function createLegend() {
  const legend = el("div", "chart-legend");
  for (const [className, label] of [
    ["chart-legend__swatch--temp", t("chart.temp")],
    ["chart-legend__swatch--feels", t("chart.feels")],
    ["chart-legend__swatch--rain", t("chart.rain")],
  ]) {
    const item = el("span", "chart-legend__item");
    item.append(el("span", `chart-legend__swatch ${className}`), el("span", null, label));
    legend.append(item);
  }
  return legend;
}

function createSvg(view) {
  const geometry = buildTemperatureChart(view.hourly, {
    width: 480,
    height: 230,
    unit: view.unit,
  });
  if (!geometry) return null;

  const suffix = geometry.unit === "f" ? "°F" : "°C";
  const summary =
    geometry.minTemp !== null && geometry.maxTemp !== null
      ? t("chart.summary", {
          min: `${Math.round(geometry.minTemp)}${suffix}`,
          max: `${Math.round(geometry.maxTemp)}${suffix}`,
        })
      : t("chart.title");

  const svg = svgNode("svg", {
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    class: "temp-chart",
    role: "img",
    "aria-label": summary,
  });

  for (const tick of geometry.yTicks) {
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
        { x: geometry.plot.left - 8, y: tick.y + 4, "text-anchor": "end", class: "temp-chart__axis" },
        `${Math.round(tick.value)}°`
      )
    );
  }

  const xLabels = new Set([0, 4, 8, 12, 16, 20, view.hourly.length - 1]);
  for (const index of xLabels) {
    const point = geometry.tempPoints[index] ?? geometry.rainBars[index];
    if (!point) continue;
    svg.append(
      svgNode(
        "text",
        { x: point.x, y: geometry.height - 6, "text-anchor": "middle", class: "temp-chart__axis" },
        formatHour(view.hourly[index]?.time)
      )
    );
  }

  for (const bar of geometry.rainBars) {
    if (!bar.value) continue;
    svg.append(
      svgNode("rect", {
        x: bar.x - 4,
        y: geometry.plot.bottom + 6 + (26 - bar.height),
        width: 8,
        height: bar.height,
        fill: "var(--sky)",
        stroke: "var(--ink)",
        "stroke-width": 1,
      })
    );
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

  svg.append(
    svgNode("path", {
      d: geometry.feelsPath,
      fill: "none",
      stroke: "var(--ink)",
      "stroke-width": 2,
      "stroke-dasharray": "6 4",
    })
  );
  svg.append(
    svgNode("path", {
      d: geometry.tempPath,
      fill: "none",
      stroke: "var(--coral)",
      "stroke-width": 4,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    })
  );

  geometry.tempPoints.forEach((point) => {
    const circle = svgNode("circle", {
      cx: point.x,
      cy: point.y,
      r: 4,
      fill: "var(--paper)",
      stroke: "var(--ink)",
      "stroke-width": 2,
    });
    circle.append(
      svgNode(
        "title",
        {},
        t("chart.point", {
          time: formatHour(point.time),
          temp: `${Math.round(point.value)}°`,
        })
      )
    );
    svg.append(circle);
  });

  return { svg, summary };
}

export function createChart() {
  const element = el("section", "panel chart-panel");
  element.setAttribute("aria-labelledby", "chart-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("chart.title"));
    title.id = "chart-title";
    head.append(title, createLegend());
    element.append(head);

    if (view.hourly.length < 2) {
      element.append(el("p", "panel__empty", t("chart.empty")));
      return;
    }

    const result = createSvg(view);
    if (!result) {
      element.append(el("p", "panel__empty", t("chart.empty")));
      return;
    }

    const wrap = el("div", "chart-wrap");
    wrap.append(result.svg);
    element.append(wrap);

    const footer = el("p", "chart-summary", result.summary);
    const rainValues = view.hourly
      .map((hour) => hour.precipitationProbability)
      .filter((value) => typeof value === "number");
    if (rainValues.length > 0) {
      footer.append(
        el("span", "chart-summary__rain", ` · ${t("chart.rain")} ${formatNumber(Math.max(...rainValues))}%`)
      );
    }
    element.append(footer);
  }

  return { element, update };
}
