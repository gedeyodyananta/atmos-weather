/**
 * Status strip di bawah header: waktu data terakhir, sumber, dan tombol
 * "Perbarui". Memakai snapshot service supaya status cache/loading konsisten.
 */

import { t } from "../i18n/index.js";
import { el } from "../utils/dom.js";
import { formatClock } from "../utils/format.js";
import { weatherService } from "../services/weatherService.js";

export function createStatusBar({ store }) {
  const element = el("div", "status-bar");
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");

  const info = el("div", "status-bar__info");
  const dot = el("span", "status-bar__dot");
  const text = el("span", "status-bar__text");
  info.append(dot, text);

  const refresh = el("button", "button button--small status-bar__refresh", t("status.refresh"));
  refresh.type = "button";

  element.append(info, refresh);

  function render() {
    const snapshot = weatherService.getSnapshot();
    const current = snapshot.weather?.current;
    const loading = snapshot.status === "loading";

    dot.classList.toggle("status-bar__dot--live", snapshot.status === "ready" && !loading);

    if (loading) {
      text.textContent = t("status.refreshing");
    } else if (current?.timestamp) {
      const zone = snapshot.weather?.timezoneAbbreviation
        ? ` ${snapshot.weather.timezoneAbbreviation}`
        : "";
      text.textContent = t("status.updated", { time: formatClock(current.timestamp), zone });
      if (snapshot.fromCache?.forecast) text.textContent += ` · ${t("status.cached")}`;
    } else {
      text.textContent = t("status.waiting");
    }

    refresh.disabled = loading;
    refresh.textContent = loading ? t("status.refreshing") : t("status.refresh");
    refresh.setAttribute("aria-label", t("status.refresh"));
  }

  refresh.addEventListener("click", () => {
    const location = store.getState().location;
    if (!location) return;
    weatherService.load(location, { force: true });
  });

  const unsubscribeWeather = weatherService.subscribe(render);
  const unsubscribeStore = store.subscribe(render);
  render();

  return {
    element,
    destroy() {
      unsubscribeWeather();
      unsubscribeStore();
      element.remove();
    },
  };
}
