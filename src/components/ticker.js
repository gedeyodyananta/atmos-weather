/**
 * Ticker ringkasan kondisi & peringatan. Isi hanya diturunkan dari data cuaca
 * nyata (`utils/alerts.js`), bukan teks statis.
 *
 * Track animasi diberi `aria-hidden`; versi teks statis dibaca screen reader.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import {
  formatNumber,
  formatTemperature,
  formatWind,
  formatWindDirection,
  getUvCategory,
} from "../utils/format.js";
import { getAqiCategory, getAqiDisplay } from "../utils/aqi.js";
import { buildWeatherAlerts } from "../utils/alerts.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { weatherService } from "../services/weatherService.js";
import { buildWeatherView } from "./view.js";

function alertText(alert, view) {
  const params = alert.params ?? {};

  switch (alert.key) {
    case "alerts.rain":
      return t(alert.key, params);
    case "alerts.uv":
      return t(alert.key, {
        value: params.value,
        level: getUvCategory(params.value)?.label ?? "—",
      });
    case "alerts.wind":
      return t(alert.key, {
        speed: formatWind(params.speed),
        direction: formatWindDirection(view.current?.windDirection) ?? "—",
      });
    case "alerts.aqi": {
      const category = getAqiCategory(params.value);
      return t(alert.key, {
        value: params.value,
        level: category ? getAqiDisplay(category)?.label : "—",
      });
    }
    case "alerts.swing":
      return t(alert.key, {
        range: `${formatTemperature(params.min, view.unit, { decimals: 0 })}–${formatTemperature(
          params.max,
          view.unit,
          { decimals: 0 }
        )}`,
      });
    default:
      return t(alert.key, params);
  }
}

function summaryItems(view) {
  const current = view.current;
  if (!current) return [];

  const items = [
    t("alerts.summary", {
      condition: getWeatherConditionLabel(current.weatherCode),
      temp: formatTemperature(current.temperature, view.unit),
      feels: formatTemperature(current.apparentTemperature, view.unit),
    }),
  ];

  const wind = formatWindDirection(current.windDirection);
  if (wind) {
    items.push(
      `${t("metric.wind")} ${formatNumber(current.windSpeed, 1)} · ${wind}`
    );
  }

  const uv = getUvCategory(current.uvIndex);
  if (uv) items.push(`${t("metric.uv")} ${formatNumber(current.uvIndex)} · ${uv.label}`);

  if (typeof view.airQuality?.aqi === "number") {
    const category = getAqiCategory(view.airQuality.aqi);
    items.push(
      `${t("aqi.scale")} ${Math.round(view.airQuality.aqi)} · ${
        category ? getAqiDisplay(category)?.label : "—"
      }`
    );
  }

  return items;
}

export function createTicker({ store }) {
  const element = el("div", "ticker");
  const label = el("span", "ticker__label", t("ticker.label"));
  label.id = "ticker-label";
  element.setAttribute("aria-labelledby", "ticker-label");

  const viewport = el("div", "ticker__viewport");
  const staticList = el("ul", "sr-only");
  element.append(label, viewport, staticList);

  function render() {
    label.textContent = t("ticker.label");
    const view = buildWeatherView(store);
    const alerts = view.current ? buildWeatherAlerts(view.weather, view.airQuality) : [];
    const texts = alerts.length > 0 ? alerts.map((alert) => alertText(alert, view)) : summaryItems(view);

    clear(viewport);
    clear(staticList);
    element.hidden = texts.length === 0;
    if (texts.length === 0) return;

    for (const text of texts) staticList.append(el("li", null, text));

    const track = el("div", "ticker__track");
    track.setAttribute("aria-hidden", "true");
    for (let pass = 0; pass < 2; pass += 1) {
      for (const text of texts) {
        const item = el("span", `ticker__item ticker__item--${alerts.length > 0 ? "alert" : "info"}`);
        item.append(el("span", "ticker__bullet", t("ticker.separator")));
        item.append(el("span", "ticker__text", text));
        track.append(item);
      }
    }
    viewport.append(track);
  }

  const unsubscribeStore = store.subscribe(render);
  const unsubscribeService = weatherService.subscribe(render);

  render();

  return {
    element,
    destroy() {
      unsubscribeStore();
      unsubscribeService();
      element.remove();
    },
  };
}
