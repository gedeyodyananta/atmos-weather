/**
 * Kompas angin bergaya teknis (arah 16 titik + kecepatan + hembusan).
 * Angka dan arah berasal dari model forecast yang sama dengan tile atmosfer.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import { getCompassDirection, getDownwindDirection } from "../utils/compass.js";
import { formatWind } from "../utils/format.js";

const NS = "http://www.w3.org/2000/svg";

function svgNode(tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function createDial(degrees) {
  const svg = svgNode("svg", { viewBox: "0 0 120 120", class: "wind-dial", "aria-hidden": "true" });

  svg.append(
    svgNode("circle", {
      cx: 60,
      cy: 60,
      r: 50,
      fill: "var(--paper)",
      stroke: "var(--ink)",
      "stroke-width": 3,
    }),
    svgNode("circle", {
      cx: 60,
      cy: 60,
      r: 38,
      fill: "none",
      stroke: "var(--ink)",
      "stroke-width": 1.5,
      "stroke-dasharray": "2 4",
    })
  );

  for (let index = 0; index < 16; index += 1) {
    const angle = (Math.PI / 8) * index;
    const major = index % 4 === 0;
    const inner = major ? 43 : 46;
    const outer = 50;
    svg.append(
      svgNode("line", {
        x1: (60 + Math.sin(angle) * inner).toFixed(1),
        y1: (60 - Math.cos(angle) * inner).toFixed(1),
        x2: (60 + Math.sin(angle) * outer).toFixed(1),
        y2: (60 - Math.cos(angle) * outer).toFixed(1),
        stroke: "var(--ink)",
        "stroke-width": major ? 3 : 1.5,
      })
    );
  }

  for (const [label, x, y] of [
    ["N", 60, 16],
    ["E", 106, 64],
    ["S", 60, 108],
    ["W", 14, 64],
  ]) {
    const text = svgNode("text", {
      x,
      y,
      "text-anchor": "middle",
      class: "wind-dial__cardinal",
    });
    text.textContent = label;
    svg.append(text);
  }

  const needle = svgNode("g", {
    transform: `rotate(${Number.isFinite(degrees) ? degrees : 0} 60 60)`,
  });
  needle.append(
    svgNode("path", {
      d: "M60 22 L54 62 L60 55 L66 62 Z",
      fill: "var(--coral)",
      stroke: "var(--ink)",
      "stroke-width": 2,
      "stroke-linejoin": "round",
    })
  );
  needle.append(
    svgNode("circle", {
      cx: 60,
      cy: 60,
      r: 5,
      fill: "var(--solar)",
      stroke: "var(--ink)",
      "stroke-width": 2,
    })
  );
  svg.append(needle);

  return svg;
}

export function createWindDial() {
  const element = el("section", "panel wind-panel");
  element.setAttribute("aria-labelledby", "wind-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("wind.title"));
    title.id = "wind-title";
    head.append(title);
    element.append(head);

    const current = view.current;
    if (!current) {
      element.append(el("p", "panel__empty", t("error.emptyData")));
      return;
    }

    const body = el("div", "wind-panel__body");
    const degrees = current.windDirection;
    const compass = getCompassDirection(degrees);
    const downwind = getDownwindDirection(degrees);

    body.append(createDial(degrees));

    const readout = el("div", "wind-panel__readout");
    readout.append(el("p", "wind-panel__speed", formatWind(current.windSpeed)));

    readout.append(
      el(
        "p",
        "wind-panel__direction",
        compass ? `${t(compass.key)} · ${compass.degrees}°` : "—"
      )
    );

    if (typeof current.windGusts === "number") {
      readout.append(
        el(
          "p",
          "wind-panel__gust",
          `${t("wind.gust")} · ${formatWind(current.windGusts)}`
        )
      );
    }

    const smoke = el("div", "wind-panel__smoke");
    smoke.append(el("p", "wind-panel__smoke-label", t("wind.smokeLabel")));
    smoke.append(
      el(
        "p",
        "wind-panel__smoke-value",
        downwind ? t("wind.smokeDrift", { direction: t(downwind.key) }) : t("wind.smokeDriftUnknown")
      )
    );
    readout.append(smoke);
    body.append(readout);

    element.setAttribute(
      "aria-label",
      t("wind.aria", {
        direction: compass ? `${t(compass.key)} ${compass.degrees}°` : "—",
        degrees: Math.round(degrees ?? 0),
      })
    );
    element.append(body);
  }

  return { element, update };
}
