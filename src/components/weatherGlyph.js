/**
 * Ilustrasi cuaca vektor lokal (UI-SPEC §2.5, T1.4).
 * Digambar langsung dari kode WMO + fase hari sehingga tidak ada aset
 * eksternal yang diunduh dan fallback selalu tersedia.
 */

import { getWeatherConditionCategory } from "../utils/wmo.js";

const NS = "http://www.w3.org/2000/svg";

function node(tag, attrs) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  return element;
}

const CLOUD_SHAPES = [
  ["rect", { x: 13, y: 30, width: 38, height: 16, rx: 7 }],
  ["circle", { cx: 25, cy: 29, r: 10 }],
  ["circle", { cx: 38, cy: 33, r: 8 }],
];

function shapesInto(group, shapes, attrs) {
  for (const [tag, base] of shapes) group.append(node(tag, { ...base, ...attrs }));
}

/** Siluet awan: bayangan keras, outline ink, lalu isi paper. */
function cloud() {
  const group = node("g", {});

  const shadow = node("g", { transform: "translate(3 3)" });
  shapesInto(shadow, CLOUD_SHAPES, { fill: "var(--ink)", stroke: "var(--ink)", "stroke-width": 5 });

  const outline = node("g", { fill: "var(--ink)", stroke: "var(--ink)", "stroke-width": 6 });
  shapesInto(outline, CLOUD_SHAPES, {});

  const fill = node("g", { fill: "var(--paper)", stroke: "var(--paper)", "stroke-width": 0 });
  shapesInto(fill, CLOUD_SHAPES, {});

  group.append(shadow, outline, fill);
  return group;
}

function sun(cx = 24, cy = 20, radius = 11) {
  const group = node("g", {});

  group.append(
    node("circle", {
      cx: cx + 2.5,
      cy: cy + 2.5,
      r: radius,
      fill: "var(--ink)",
    })
  );

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI / 4) * index;
    const inner = radius + 3;
    const outer = radius + 8;
    group.append(
      node("line", {
        x1: (cx + Math.cos(angle) * inner).toFixed(1),
        y1: (cy + Math.sin(angle) * inner).toFixed(1),
        x2: (cx + Math.cos(angle) * outer).toFixed(1),
        y2: (cy + Math.sin(angle) * outer).toFixed(1),
        stroke: "var(--ink)",
        "stroke-width": 3.5,
        "stroke-linecap": "square",
      })
    );
  }
  group.append(
    node("circle", {
      cx,
      cy,
      r: radius,
      fill: "var(--solar)",
      stroke: "var(--ink)",
      "stroke-width": 3,
    })
  );
  return group;
}

function moon(cx = 32, cy = 28, radius = 13) {
  const group = node("g", {});
  group.append(
    node("circle", {
      cx: cx + 2.5,
      cy: cy + 2.5,
      r: radius,
      fill: "var(--ink)",
    })
  );
  group.append(
    node("circle", {
      cx,
      cy,
      r: radius,
      fill: "var(--solar)",
      stroke: "var(--ink)",
      "stroke-width": 3,
    })
  );
  for (const [dx, dy, r] of [
    [-4, -3, 2.4],
    [3, 4, 1.8],
    [5, -5, 1.4],
  ]) {
    group.append(
      node("circle", { cx: cx + dx, cy: cy + dy, r, fill: "var(--ink)", opacity: 0.35 })
    );
  }
  return group;
}

function stars() {
  const group = node("g", {});
  for (const [x, y, scale] of [
    [12, 12, 1],
    [51, 10, 0.8],
    [55, 24, 0.65],
    [10, 26, 0.6],
  ]) {
    group.append(
      node("path", {
        d: `M${x} ${y - 3 * scale}l${1.2 * scale} ${1.8 * scale} ${1.8 * scale} ${1.2 * scale}-${1.8 * scale} ${1.2 * scale}-${1.2 * scale} ${1.8 * scale}-${1.2 * scale}-${1.8 * scale}-${1.8 * scale}-${1.2 * scale} ${1.8 * scale}-${1.2 * scale}z`,
        fill: "var(--ink)",
      })
    );
  }
  return group;
}

function rainDrops() {
  const group = node("g", {});
  for (const x of [21, 32, 43]) {
    group.append(
      node("line", {
        x1: x,
        y1: 48,
        x2: x - 2,
        y2: 57,
        stroke: "var(--ink)",
        "stroke-width": 3.5,
        "stroke-linecap": "square",
      })
    );
  }
  return group;
}

function bolt() {
  return node("path", {
    d: "M31 46l-8 13h6l-3 8 12-14h-6l4-7z",
    fill: "var(--solar)",
    stroke: "var(--ink)",
    "stroke-width": 2.5,
    "stroke-linejoin": "round",
  });
}

function snowFlakes() {
  const group = node("g", {});
  for (const [x, y] of [
    [21, 52],
    [32, 56],
    [43, 52],
  ]) {
    group.append(
      node("circle", {
        cx: x,
        cy: y,
        r: 2.6,
        fill: "var(--paper)",
        stroke: "var(--ink)",
        "stroke-width": 2,
      })
    );
  }
  return group;
}

function fogLines() {
  const group = node("g", {});
  for (const [y, x2] of [
    [50, 48],
    [55, 42],
    [60, 46],
  ]) {
    group.append(
      node("line", {
        x1: 16,
        y1: y,
        x2,
        y2: y,
        stroke: "var(--ink)",
        "stroke-width": 3.5,
        "stroke-linecap": "square",
      })
    );
  }
  return group;
}

/**
 * @param {number} code kode WMO
 * @param {{ size?: number, label?: string, decorative?: boolean, isDay?: boolean }} [options]
 */
export function createWeatherGlyph(
  code,
  { size = 40, label, decorative = false, isDay = true } = {}
) {
  const category = getWeatherConditionCategory(code);
  const svg = node("svg", {
    viewBox: "0 0 64 64",
    width: size,
    height: size,
    focusable: "false",
  });

  if (decorative || !label) {
    svg.setAttribute("aria-hidden", "true");
  } else {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  }

  const night = !isDay;

  if (category === "clear") {
    if (night) {
      svg.append(stars(), moon(32, 32, 14));
    } else {
      svg.append(sun(32, 32, 13));
    }
    return svg;
  }

  if (category === "unknown" && night) svg.append(stars());
  if (category === "cloud" && night) svg.append(stars());

  if (category === "cloud" || category === "unknown") {
    if (night) svg.append(moon(20, 18, 8));
    else svg.append(sun(20, 18, 9));
  }

  svg.append(cloud());

  if (category === "rain" || category === "storm") svg.append(rainDrops());
  if (category === "storm") svg.append(bolt());
  if (category === "snow") svg.append(snowFlakes());
  if (category === "fog") svg.append(fogLines());

  return svg;
}

export function createRainIcon(size = 14) {
  const svg = node("svg", {
    viewBox: "0 0 16 16",
    width: size,
    height: size,
    "aria-hidden": "true",
    focusable: "false",
  });
  svg.append(
    node("path", {
      d: "M8 1.5c2.6 3.2 4.4 5.6 4.4 7.6a4.4 4.4 0 0 1-8.8 0c0-2 1.8-4.4 4.4-7.6z",
      fill: "var(--sky)",
      stroke: "var(--ink)",
      "stroke-width": 1.4,
    })
  );
  return svg;
}
