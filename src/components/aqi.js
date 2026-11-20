/**
 * Panel kualitas udara (SPEC F13, T6.3).
 * Angka, kategori, dan meter posisi memakai data Open-Meteo yang sudah ada;
 * rincian polutan ada di panel tersendiri. Kegagalan AQI tidak pernah
 * mengubah panel cuaca lain.
 */

import { t } from "../i18n/index.js";
import { getAqiCategory, getAqiDisplay } from "../utils/aqi.js";
import { clear, el } from "../utils/dom.js";
import { formatNumber } from "../utils/format.js";

const METER_SEGMENTS = [
  { key: "good", size: 50 },
  { key: "moderate", size: 50 },
  { key: "sensitive", size: 50 },
  { key: "unhealthy", size: 50 },
  { key: "very_unhealthy", size: 100 },
];

function createSkeleton() {
  const wrapper = el("div", "aqi-panel__skeleton");
  wrapper.append(
    el("div", "skeleton skeleton--aqi-value"),
    el("div", "skeleton skeleton--line"),
    el("div", "air-skeleton skeleton")
  );
  return wrapper;
}

function createMeter(value) {
  const meter = el("div", "aqi-meter");
  meter.setAttribute("role", "img");
  meter.setAttribute("aria-label", t("aqi.meterAria", { value }));

  const track = el("div", "aqi-meter__track");
  for (const segment of METER_SEGMENTS) {
    const block = el("span", `aqi-meter__segment aqi-meter__segment--${segment.key}`);
    block.style.width = `${(segment.size / 300) * 100}%`;
    track.append(block);
  }
  meter.append(track);

  const position = Math.min(100, Math.max(0, (value / 300) * 100));
  const marker = el("span", "aqi-meter__marker");
  marker.style.left = `${position}%`;
  meter.append(marker);

  const labels = el("div", "aqi-meter__labels");
  labels.append(
    el("span", null, t("aqi.meterLow")),
    el("span", null, t("aqi.meterHigh"))
  );
  meter.append(labels);

  return meter;
}

function createRetryBlock(message, onRetry) {
  const block = el("div", "panel-error panel-error--inline");
  block.append(el("p", "panel-error__text", message));
  const retry = el("button", "button button--small", t("aqi.retry"));
  retry.type = "button";
  retry.addEventListener("click", () => onRetry?.());
  block.append(retry);
  return block;
}

export function createAqiPanel() {
  const element = el("section", "panel aqi-panel");
  element.setAttribute("aria-labelledby", "aqi-title");

  function update(view) {
    clear(element);
    const raw = view.airQuality?.aqi;
    const hasValue = typeof raw === "number" && Number.isFinite(raw);
    const category = hasValue ? getAqiCategory(raw) : null;
    const display = category ? getAqiDisplay(category) : null;

    element.dataset.aqi = category?.key ?? "unknown";

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("aqi.title"));
    title.id = "aqi-title";
    head.append(title, el("span", "aqi-panel__scale", t("aqi.scale")));
    element.append(head);

    if (!hasValue && (view.airQualityStatus === "loading" || view.airQualityStatus === "idle")) {
      element.append(createSkeleton());
      return;
    }

    if (!hasValue && view.airQualityStatus === "error") {
      element.append(createRetryBlock(t("aqi.error"), view.onRetryAqi));
      return;
    }

    if (!hasValue) {
      element.append(el("p", "panel__empty", t("aqi.unavailable")));
      return;
    }

    const main = el("div", "aqi-panel__main");
    const readout = el("div", "aqi-panel__readout");
    readout.append(el("p", "aqi-panel__value", formatNumber(raw)));
    readout.append(el("p", "aqi-panel__badge", display?.badge ?? "—"));
    main.append(readout);

    const meterWrap = el("div", "aqi-panel__meter");
    meterWrap.append(createMeter(Math.round(raw)));
    main.append(meterWrap);
    element.append(main);

    if (display) element.append(el("p", "aqi-panel__desc", display.description));
  }

  return { element, update };
}
