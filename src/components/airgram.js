/**
 * Airgram: poster udara 9:16 / 4:5 yang dirender ke canvas lokal.
 * Tidak ada data baru atau layanan pihak ketiga; semua berasal dari snapshot
 * cuaca/AQI yang sedang tampil.
 */

import { t } from "../i18n/index.js";
import {
  AIRGRAM_FORMATS,
  buildAirgramFilename,
  buildAirgramModel,
  getAirgramDimensions,
  normalizeAirgramFormat,
} from "../utils/airgram.js";
import { buildWeatherView } from "./view.js";
import { createOverlay } from "./overlay.js";

const INK = "#17171b";
const PAPER = "#f4f0e6";
const CREAM = "#f6f2e8";
const SOLAR = "#f5c445";
const CORAL = "#ef6b55";
const VIOLET = "#8b7cf6";
const LIME = "#b8e06a";
const SANS = '"Space Grotesk", "Segoe UI", sans-serif';
const BODY = '"Inter", "Segoe UI", sans-serif';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function rect(ctx, x, y, width, height) {
  ctx.fillRect(x, y, width, height);
}

function shadowRect(ctx, x, y, width, height, fill, offset = 16) {
  ctx.fillStyle = INK;
  rect(ctx, x + offset, y + offset, width, height);
  ctx.fillStyle = fill;
  rect(ctx, x, y, width, height);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.strokeRect(x, y, width, height);
}

function label(ctx, text, x, y, { size = 24, color = INK, weight = 700, font = BODY } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textBaseline = "top";
  ctx.fillText(String(text), x, y);
}

function fitFont(ctx, text, maxWidth, startSize, minSize, weight = 700, family = SANS) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(String(text)).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function drawPattern(ctx, x, y, width, height, tone) {
  if (!["sensitive", "unhealthy", "hazardous"].includes(tone)) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.strokeStyle = "rgba(23, 23, 27, 0.18)";
  ctx.lineWidth = 10;
  const gap = 34;
  for (let offset = -height; offset < width + height; offset += gap) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + height);
    ctx.lineTo(x + offset + height, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBarcode(ctx, x, y, width, height) {
  let cursor = x;
  let index = 0;
  while (cursor < x + width) {
    const bar = index % 4 === 0 ? 5 : index % 3 === 0 ? 3 : 1;
    ctx.fillStyle = INK;
    ctx.fillRect(cursor, y, bar, height);
    cursor += bar + (index % 5 === 0 ? 6 : 3);
    index += 1;
    if (index > 80) break;
  }
}

function drawPoster(ctx, model, format) {
  const { width, height } = getAirgramDimensions(format);
  const story = format === "story";
  const margin = Math.round(width * 0.066);
  const contentWidth = width - margin * 2;
  const headerHeight = story ? 122 : 102;
  const panelTop = story ? 354 : 280;
  const panelHeight = story ? 590 : 450;
  const statsTop = panelTop + panelHeight + (story ? 94 : 78);
  const statsHeight = story ? 222 : 180;
  const footerTop = height - (story ? 278 : 220);

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = PAPER;
  rect(ctx, 0, 0, width, height);

  // Header hitam tebal.
  ctx.fillStyle = INK;
  rect(ctx, 0, 0, width, headerHeight);
  label(ctx, "ATMOS", margin, story ? 30 : 24, {
    size: story ? 50 : 42,
    color: CREAM,
    family: SANS,
  });
  ctx.textAlign = "right";
  label(ctx, "AIR REPORT / " + (story ? "STORY" : "POST"), width - margin, story ? 44 : 36, {
    size: story ? 18 : 16,
    color: SOLAR,
    font: SANS,
  });
  ctx.font = `600 ${story ? 14 : 12}px ${SANS}`;
  ctx.fillStyle = CREAM;
  ctx.fillText(`#${model.dateKey.replaceAll("-", "")}`, width - margin, story ? 74 : 64);
  ctx.textAlign = "left";

  // Lokasi dan waktu.
  const locationSize = story ? 65 : 54;
  ctx.font = `700 ${locationSize}px ${SANS}`;
  const locationLines = wrapLines(ctx, model.location, contentWidth, 2);
  let lineY = headerHeight + (story ? 36 : 30);
  for (const line of locationLines) {
    label(ctx, line, margin, lineY, { size: locationSize, family: SANS });
    lineY += locationSize * 0.92;
  }
  label(ctx, model.region || model.coordinates, margin, lineY + 4, {
    size: story ? 20 : 17,
    color: "#55524a",
    weight: 600,
    font: SANS,
  });
  label(ctx, `${model.date} · ${model.time}${model.zone ? ` ${model.zone}` : ""}`, margin, lineY + 36, {
    size: story ? 18 : 15,
    color: INK,
    weight: 600,
    font: SANS,
  });

  // Panel AQI utama.
  const panelColor = model.color;
  shadowRect(ctx, margin, panelTop, contentWidth, panelHeight, panelColor, story ? 20 : 14);
  drawPattern(ctx, margin, panelTop, contentWidth, panelHeight, model.tone);

  label(ctx, "US AQI / PM2.5", margin + 26, panelTop + 24, {
    size: story ? 19 : 16,
    color: model.tone === "very_unhealthy" || model.tone === "hazardous" ? CREAM : INK,
    font: SANS,
  });
  ctx.textAlign = "right";
  label(ctx, model.aqiBadge, width - margin - 26, panelTop + 24, {
    size: story ? 20 : 16,
    color: model.tone === "very_unhealthy" || model.tone === "hazardous" ? CREAM : INK,
    font: SANS,
  });
  ctx.textAlign = "left";

  const aqiText = model.aqi === null ? "—" : String(model.aqi);
  const aqiSize = fitFont(ctx, aqiText, contentWidth - 70, story ? 330 : 250, 120, 700, SANS);
  label(ctx, aqiText, margin + 24, panelTop + (story ? 85 : 68), {
    size: aqiSize,
    color: model.tone === "very_unhealthy" || model.tone === "hazardous" ? CREAM : INK,
    family: SANS,
  });
  label(ctx, model.aqiCategory, margin + 30, panelTop + panelHeight - (story ? 92 : 74), {
    size: story ? 34 : 27,
    color: model.tone === "very_unhealthy" || model.tone === "hazardous" ? CREAM : INK,
    family: SANS,
  });
  label(ctx, model.scale, margin + 30, panelTop + panelHeight - (story ? 48 : 38), {
    size: story ? 15 : 13,
    color: model.tone === "very_unhealthy" || model.tone === "hazardous" ? CREAM : INK,
    weight: 600,
    font: SANS,
  });

  // Masker dan cuaca.
  const maskTop = panelTop + panelHeight + (story ? 24 : 20);
  shadowRect(ctx, margin, maskTop, contentWidth, story ? 48 : 40, INK, 8);
  label(ctx, t("airgram.maskLabel"), margin + 18, maskTop + 11, {
    size: story ? 16 : 14,
    color: SOLAR,
    font: SANS,
  });
  ctx.textAlign = "right";
  label(ctx, model.mask, width - margin - 18, maskTop + 10, {
    size: story ? 22 : 18,
    color: CREAM,
    family: SANS,
  });
  ctx.textAlign = "left";

  // Tiga blok statistik.
  const gap = 14;
  const cardWidth = (contentWidth - gap * 2) / 3;
  const stats = [
    [t("airgram.pmLabel"), model.pm25, model.pm25Available ? "µg/m³" : ""],
    [t("airgram.cigaretteLabel"), model.cigarette === null ? "—" : model.cigarette.toFixed(1), t("airgram.cigaretteUnit")],
    [t("airgram.bestLabel"), model.bestWindow ?? "—", model.bestAverage === null ? "" : `AQI ${model.bestAverage}`],
  ];

  stats.forEach(([heading, value, unit], index) => {
    const x = margin + index * (cardWidth + gap);
    shadowRect(ctx, x, statsTop, cardWidth, statsHeight, index === 1 ? SOLAR : CREAM, 8);
    label(ctx, heading, x + 16, statsTop + 14, {
      size: story ? 13 : 11,
      color: "#55524a",
      font: SANS,
    });
    const valueSize = fitFont(ctx, value, cardWidth - 32, story ? 50 : 38, 20, 700, SANS);
    label(ctx, value, x + 16, statsTop + (story ? 52 : 42), {
      size: valueSize,
      family: SANS,
    });
    if (unit) {
      label(ctx, unit, x + 16, statsTop + statsHeight - (story ? 42 : 32), {
        size: story ? 13 : 11,
        color: "#55524a",
        weight: 600,
        font: SANS,
      });
    }
  });

  // Footer teknis.
  ctx.fillStyle = INK;
  rect(ctx, margin, footerTop, contentWidth, height - footerTop - margin);
  label(ctx, `${model.condition} · ${model.temperature?.value ?? "—"}${model.temperature?.unit ?? ""}`, margin + 20, footerTop + 20, {
    size: story ? 19 : 16,
    color: CREAM,
    font: SANS,
  });
  label(ctx, model.coordinates, margin + 20, footerTop + (story ? 52 : 44), {
    size: story ? 13 : 11,
    color: SOLAR,
    weight: 600,
    font: SANS,
  });
  const footerTextSize = story ? 13 : 11;
  ctx.font = `500 ${footerTextSize}px ${BODY}`;
  const footerLines = wrapLines(ctx, model.disclaimer, contentWidth - 44, 2);
  footerLines.forEach((line, index) => {
    label(ctx, line, margin + 20, footerTop + (story ? 86 : 70) + index * (footerTextSize + 4), {
      size: footerTextSize,
      color: CREAM,
      weight: 500,
    });
  });
  drawBarcode(ctx, width - margin - 190, footerTop + (story ? 30 : 20), 170, story ? 40 : 30);
  ctx.textAlign = "right";
  label(ctx, "OPEN-METEO / CC BY 4.0", width - margin, height - margin - 16, {
    size: story ? 11 : 10,
    color: CREAM,
    weight: 600,
    font: SANS,
  });
  ctx.textAlign = "left";
}

function setActiveFormat(buttons, format) {
  for (const button of buttons) {
    button.setAttribute("aria-pressed", button.dataset.format === format ? "true" : "false");
  }
}

export function createAirgram({ store, notify } = {}) {
  const overlay = createOverlay({
    className: "overlay--airgram",
    eyebrow: t("airgram.eyebrow"),
    title: t("airgram.title"),
    size: "lg",
  });

  const root = node("div", "airgram");
  const preview = node("div", "airgram__preview");
  const canvas = node("canvas", "airgram__canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", t("airgram.canvasAria"));
  preview.append(canvas);

  const side = node("div", "airgram__side");
  const formats = node("div", "airgram__formats");
  formats.setAttribute("role", "group");
  formats.setAttribute("aria-label", t("airgram.formatLabel"));
  const formatButtons = Object.entries(AIRGRAM_FORMATS).map(([value, config]) => {
    const button = node("button", "airgram__format", t(config.labelKey));
    button.type = "button";
    button.dataset.format = value;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      format = normalizeAirgramFormat(value);
      setActiveFormat(formatButtons, format);
      draw();
    });
    formats.append(button);
    return button;
  });
  setActiveFormat(formatButtons, "story");

  const actions = node("div", "airgram__actions");
  const download = node("button", "button", t("airgram.download"));
  download.type = "button";
  const share = node("button", "button button--ghost", t("airgram.share"));
  share.type = "button";
  actions.append(download, share);

  const status = node("p", "airgram__status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const note = node("p", "airgram__note", t("airgram.note"));
  const empty = node("p", "airgram__empty", t("airgram.empty"));
  empty.hidden = true;

  side.append(formats, actions, status, note);
  root.append(preview, side);
  overlay.body.append(root, empty);

  let format = "story";
  let model = null;
  let generatedBlob = null;
  let generating = null;

  function setStatus(message) {
    status.textContent = message ?? "";
  }

  function updateShareSupport() {
    const supported =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof File === "function";
    share.disabled = !supported;
    share.title = supported ? t("airgram.shareHint") : t("airgram.shareUnsupported");
  }

  function draw() {
    model = buildAirgramModel(buildWeatherView(store));
    generatedBlob = null;
    empty.hidden = Boolean(model);
    preview.hidden = !model;
    actions.hidden = !model;
    if (!model) {
      setStatus("");
      return;
    }

    const dimensions = getAirgramDimensions(format);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext?.("2d");
    if (!context) {
      empty.hidden = false;
      preview.hidden = true;
      empty.textContent = t("airgram.canvasUnavailable");
      return;
    }
    drawPoster(context, model, format);
    setStatus(t("airgram.ready"));
  }

  async function waitForFonts() {
    if (!document.fonts?.ready) return;
    try {
      await document.fonts.ready;
    } catch {
      // Canvas tetap memakai fallback font bila font gagal dimuat.
    }
  }

  function toBlob() {
    if (generatedBlob) return Promise.resolve(generatedBlob);
    if (generating) return generating;

    generating = new Promise((resolve, reject) => {
      if (typeof canvas.toBlob !== "function") {
        reject(new Error("Canvas toBlob tidak didukung"));
        return;
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas tidak menghasilkan gambar"));
          return;
        }
        generatedBlob = blob;
        resolve(blob);
      }, "image/png");
    }).finally(() => {
      generating = null;
    });

    return generating;
  }

  async function downloadCard() {
    if (!model) return;
    download.disabled = true;
    setStatus(t("airgram.generating"));
    try {
      await waitForFonts();
      draw();
      const blob = await toBlob();
      const url = URL.createObjectURL(blob);
      const link = node("a");
      link.href = url;
      link.download = buildAirgramFilename(model, format);
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus(t("airgram.downloaded"));
      notify?.(t("airgram.downloaded"));
    } catch {
      setStatus(t("airgram.downloadError"));
      notify?.(t("airgram.downloadError"));
    } finally {
      download.disabled = false;
    }
  }

  async function shareCard() {
    if (!model) return;
    share.disabled = true;
    setStatus(t("airgram.generating"));
    try {
      await waitForFonts();
      draw();
      const blob = await toBlob();
      const file = new File([blob], buildAirgramFilename(model, format), { type: "image/png" });
      if (!navigator.canShare?.({ files: [file] })) {
        setStatus(t("airgram.shareUnsupported"));
        return;
      }
      await navigator.share({
        title: t("airgram.shareTitle"),
        text: t("airgram.shareText", { location: model.location }),
        files: [file],
      });
      setStatus(t("airgram.shared"));
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus(t("airgram.ready"));
        return;
      }
      setStatus(t("airgram.shareError"));
      notify?.(t("airgram.shareError"));
    } finally {
      updateShareSupport();
    }
  }

  download.addEventListener("click", downloadCard);
  share.addEventListener("click", shareCard);

  return {
    open() {
      overlay.setTitle(t("airgram.title"));
      overlay.setEyebrow(t("airgram.eyebrow"));
      formats.setAttribute("aria-label", t("airgram.formatLabel"));
      for (const button of formatButtons) {
        button.textContent = t(AIRGRAM_FORMATS[button.dataset.format].labelKey);
      }
      download.textContent = t("airgram.download");
      share.textContent = t("airgram.share");
      note.textContent = t("airgram.note");
      empty.textContent = t("airgram.empty");
      canvas.setAttribute("aria-label", t("airgram.canvasAria"));
      updateShareSupport();
      overlay.open({ focus: () => formatButtons[0] });
      draw();
      waitForFonts().then(() => {
        if (overlay.isOpen()) draw();
      });
    },
    close() {
      overlay.close();
    },
    element: overlay.root,
  };
}
