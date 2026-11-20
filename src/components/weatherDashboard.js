/**
 * Dashboard cuaca utama dalam susunan Bento: hero, AQI, per jam, 7 hari,
 * grafik, atmosfer, angin, dan matahari. Satu view dipakai semua panel agar
 * lokasi/satuan/bahasa selalu sinkron.
 */

import { t } from "../i18n/index.js";
import { weatherService } from "../services/weatherService.js";
import { el } from "../utils/dom.js";
import { createAirTrend } from "./airTrend.js";
import { createAqiPanel } from "./aqi.js";
import { createAtmosphere } from "./atmosphere.js";
import { createChart } from "./chart.js";
import { createDaily } from "./daily.js";
import { createHero } from "./dashboard.js";
import { createHazeHero } from "./hazeHero.js";
import { createHourly } from "./hourly.js";
import { createPollutantPanel } from "./pollutantPanel.js";
import { createSunArc } from "./sunArc.js";
import { buildWeatherView, hasCoordinates, retryAirQuality, retryForecast } from "./view.js";
import { createWindDial } from "./windDial.js";

export function createWeatherDashboard({ store, onOpenAirgram } = {}) {
  const section = el("section", "dashboard");
  section.setAttribute("aria-label", t("a11y.dashboard"));

  const haze = createHazeHero({ onOpenAirgram });
  const pollutants = createPollutantPanel();
  const airTrend = createAirTrend();
  const aqi = createAqiPanel();
  const hero = createHero();
  const wind = createWindDial();
  const hourly = createHourly();
  const daily = createDaily();
  const chart = createChart();
  const atmosphere = createAtmosphere();
  const sun = createSunArc();

  section.append(
    haze.element,
    pollutants.element,
    airTrend.element,
    aqi.element,
    hero.element,
    wind.element,
    hourly.element,
    daily.element,
    chart.element,
    atmosphere.element,
    sun.element
  );

  let loadedLocationId = null;

  function render() {
    section.setAttribute("aria-label", t("a11y.dashboard"));
    const view = buildWeatherView(store);
    view.onRetry = retryForecast;
    view.onRetryAqi = retryAirQuality;

    haze.update(view);
    pollutants.update(view);
    airTrend.update(view);
    aqi.update(view);
    hero.update(view);
    wind.update(view);
    hourly.update(view);
    daily.update(view);
    chart.update(view);
    atmosphere.update(view);
    sun.update(view);
  }

  function syncLocation() {
    const location = store.getState().location;
    if (!hasCoordinates(location) || location.id === loadedLocationId) return;
    loadedLocationId = location.id;
    weatherService.load(location);
  }

  const unsubscribeStore = store.subscribe(() => {
    syncLocation();
    render();
  });
  const unsubscribeWeather = weatherService.subscribe(render);

  syncLocation();
  render();

  return {
    element: section,
    destroy() {
      unsubscribeStore();
      unsubscribeWeather();
      section.remove();
    },
  };
}
