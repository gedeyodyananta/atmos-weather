/**
 * Dashboard cuaca utama: merangkai hero, prakiraan per jam, dan prakiraan
 * 7 hari untuk lokasi aktif. Setiap kali lokasi di store berubah (mis. diklik
 * dari panel LOKASI), data dimuat ulang lewat `weatherService`.
 */

import { weatherService } from "../services/weatherService.js";
import { el } from "../utils/dom.js";
import { createDaily } from "./daily.js";
import { createHero } from "./dashboard.js";
import { createHourly } from "./hourly.js";

function hasCoordinates(location) {
  return Boolean(
    location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
  );
}

function sameLocation(a, b) {
  if (!hasCoordinates(a) || !hasCoordinates(b)) return false;
  return (
    Math.abs(a.latitude - b.latitude) < 1e-6 && Math.abs(a.longitude - b.longitude) < 1e-6
  );
}

export function createWeatherDashboard({ store }) {
  const section = el("section", "dashboard");
  section.setAttribute("aria-label", "Dashboard cuaca lokasi aktif");

  const hero = createHero();
  const hourly = createHourly();
  const daily = createDaily();
  section.append(hero.element, hourly.element, daily.element);

  let loadedLocationId = null;

  function retry() {
    const location = store.getState().location;
    if (!hasCoordinates(location)) return;
    weatherService.load(location, { force: true });
  }

  function buildView() {
    const state = store.getState();
    const snapshot = weatherService.getSnapshot();
    const matches = sameLocation(snapshot.location, state.location);

    return {
      location: state.location,
      isSample: state.isSampleLocation === true,
      unit: state.unit ?? "c",
      status: matches ? snapshot.status : "loading",
      error: matches ? snapshot.error : null,
      weather: matches ? snapshot.weather : null,
      airQuality: matches ? snapshot.airQuality : null,
      airQualityStatus: matches ? snapshot.airQualityStatus : "loading",
      timezoneAbbreviation: matches ? snapshot.weather?.timezoneAbbreviation ?? null : null,
      onRetry: retry,
    };
  }

  function render() {
    const view = buildView();
    hero.update(view);
    hourly.update(view);
    daily.update(view);
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
