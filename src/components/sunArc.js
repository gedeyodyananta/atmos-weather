/**
 * Busur matahari: posisi matahari sekarang di antara terbit dan terbenam,
 * plus panjang hari. Data berasal dari `daily.sunrise/sunset` + `is_day`.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import { formatClock } from "../utils/format.js";
import { formatDayLength, getSunProgress } from "../utils/sun.js";

const NS = "http://www.w3.org/2000/svg";

function svgNode(tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function quadraticPoint(progress) {
  const left = { x: 30, y: 92 };
  const control = { x: 180, y: -26 };
  const right = { x: 330, y: 92 };
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * left.x + 2 * inverse * progress * control.x + progress * progress * right.x,
    y: inverse * inverse * left.y + 2 * inverse * progress * control.y + progress * progress * right.y,
  };
}

function createDiagram(view) {
  const current = view.current;
  const { state, progress } = getSunProgress(
    current?.timestamp,
    current?.sunrise,
    current?.sunset
  );

  const svg = svgNode("svg", {
    viewBox: "0 0 360 120",
    class: "sun-arc",
    role: "img",
    "aria-label": t("sun.title"),
  });

  svg.append(
    svgNode("line", {
      x1: 20,
      y1: 92,
      x2: 340,
      y2: 92,
      stroke: "var(--ink)",
      "stroke-width": 3,
    })
  );

  svg.append(
    svgNode("path", {
      d: "M30 92 Q180 -26 330 92",
      fill: "none",
      stroke: "var(--ink)",
      "stroke-width": 2,
      "stroke-dasharray": "4 6",
    })
  );

  if (state !== "unknown" && progress !== null) {
    const point = quadraticPoint(progress);
    const night = state === "night";

    svg.append(
      svgNode("line", {
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: 92,
        stroke: "var(--ink)",
        "stroke-width": 1.5,
        "stroke-dasharray": "3 4",
      })
    );

    svg.append(
      svgNode("circle", {
        cx: point.x,
        cy: point.y,
        r: 11,
        fill: night ? "var(--paper)" : "var(--solar)",
        stroke: "var(--ink)",
        "stroke-width": 3,
      })
    );

    if (night) {
      svg.append(
        svgNode("circle", {
          cx: point.x + 3,
          cy: point.y - 2,
          r: 8,
          fill: "var(--ink)",
        })
      );
    }
  }

  return { svg, state };
}

function createFact(label, value) {
  const fact = el("div", "sun-fact");
  fact.append(el("p", "sun-fact__label", label));
  fact.append(el("p", "sun-fact__value", value));
  return fact;
}

export function createSunArc() {
  const element = el("section", "panel sun-panel");
  element.setAttribute("aria-labelledby", "sun-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("sun.title"));
    title.id = "sun-title";
    head.append(title);
    element.append(head);

    const current = view.current;
    if (!current || !current.sunrise || !current.sunset) {
      element.append(el("p", "panel__empty", t("error.emptyData")));
      return;
    }

    const { svg, state } = createDiagram(view);
    element.append(svg);

    const badge = el(
      "span",
      `sun-panel__phase sun-panel__phase--${state}`,
      state === "night" ? t("sun.night") : state === "day" ? t("sun.day") : "—"
    );
    head.append(badge);

    const dayLength = formatDayLength(getSunProgress(current.timestamp, current.sunrise, current.sunset).dayLengthMinutes);

    const facts = el("div", "sun-facts");
    facts.append(
      createFact(t("sun.sunrise"), formatClock(current.sunrise)),
      createFact(t("sun.sunset"), formatClock(current.sunset)),
      createFact(
        t("sun.dayLength"),
        dayLength
          ? t("sun.hoursMinutes", { hours: dayLength.hours, minutes: dayLength.minutes })
          : "—"
      )
    );
    element.append(facts);
  }

  return { element, update };
}
