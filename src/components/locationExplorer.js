/**
 * Panel "Lokasi": daftar lokasi tersimpan dengan pencarian, filter
 * (Semua Lokasi / Favorit / Negara / Zona Waktu) dan pengurutan yang dapat
 * dikombinasikan. Penyaringan murni ada di `utils/locationFilters.js`.
 */

import { weatherService } from "../services/weatherService.js";
import { KARHUTLA_PRESETS, MAX_SAVED_LOCATIONS } from "../config/constants.js";
import { t } from "../i18n/index.js";
import {
  isValidLocation,
  readSavedLocations,
  writeLastLocation,
  writeSavedLocations,
} from "../core/storage.js";
import { getAqiCategory, getAqiDisplay } from "../utils/aqi.js";
import { rankAirQuality } from "../utils/airRanking.js";
import { clear, el } from "../utils/dom.js";
import { formatTemperature } from "../utils/format.js";
import { getLocationDisplayName } from "../utils/locationName.js";
import { buildWeatherShareUrl, validateWeatherShareData } from "../utils/weatherShare.js";
import {
  LOCATION_SCOPE_ALL,
  LOCATION_SCOPE_FAVORITES,
  LOCATION_SORT_OPTIONS,
  filterLocations,
  getFilterOptions,
} from "../utils/locationFilters.js";
import { createLocationSearch } from "./locationSearch.js";

const SHARE_REASON_KEYS = {
  INVALID_DATA: "share.err.invalidData",
  MISSING_NAME: "share.err.missingName",
  MISSING_TEMPERATURE: "share.err.missingTemperature",
  MISSING_CONDITION: "share.err.missingCondition",
  MISSING_AQI: "share.err.missingAqi",
};

export function createLocationExplorer({ store, onOpenBattle } = {}) {
  const section = el("section", "location-panel");
  section.setAttribute("aria-labelledby", "location-panel-title");

  const head = el("div", "location-panel__head");
  const heading = el("h2", "section-title", t("locations.title"));
  heading.id = "location-panel-title";
  const count = el("p", "location-panel__count");
  const headActions = el("div", "location-panel__head-actions");
  const battleButton = el("button", "button button--small location-panel__battle", t("battle.open"));
  battleButton.type = "button";
  battleButton.addEventListener("click", () => onOpenBattle?.());
  headActions.append(count, battleButton);
  head.append(heading, headActions);

  const search = createLocationSearch({
    onSelect: handleSearchSelect,
    onQueryChange: (query) => {
      filterQuery = query;
      renderList();
    },
  });

  const presetsSection = el("div", "location-panel__presets");
  const presetsLabel = el("p", "location-panel__presets-label", t("locations.presets"));
  const presetChips = el("div", "location-presets");
  presetsSection.append(presetsLabel, presetChips);

  const controls = el("div", "location-panel__controls");

  const filterLabel = el("label", "field");
  filterLabel.append(el("span", "field__label", t("locations.filter")));
  const scopeSelect = el("select", "field__control");
  scopeSelect.id = "location-filter";
  filterLabel.append(scopeSelect);

  const sortLabel = el("label", "field");
  sortLabel.append(el("span", "field__label", t("locations.sort")));
  const sortSelect = el("select", "field__control");
  sortSelect.id = "location-sort";
  const SORT_LABEL_KEYS = {
    "name-asc": "sort.nameAsc",
    "temperature-asc": "sort.temperatureAsc",
    "temperature-desc": "sort.temperatureDesc",
    "aqi-asc": "sort.aqiAsc",
  };
  for (const option of LOCATION_SORT_OPTIONS) {
    const node = el("option", null, t(SORT_LABEL_KEYS[option.value] ?? "sort.nameAsc"));
    node.value = option.value;
    sortSelect.append(node);
  }
  sortLabel.append(sortSelect);

  controls.append(filterLabel, sortLabel);

  const status = el("p", "location-panel__status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const list = el("ul", "location-list");
  const emptyState = el("div", "location-list__empty");

  const leaderboard = el("section", "air-leaderboard");
  leaderboard.setAttribute("aria-label", t("leaderboard.title"));

  const hint = el(
    "p",
    "location-panel__hint",
    t("locations.hint", { max: MAX_SAVED_LOCATIONS })
  );

  section.append(
    head,
    search.element,
    presetsSection,
    controls,
    status,
    list,
    emptyState,
    leaderboard,
    hint
  );

  let locations = loadInitialLocations();
  let filterQuery = "";
  let scope = LOCATION_SCOPE_ALL;
  let sort = "name-asc";

  sortSelect.value = sort;

  function loadInitialLocations() {
    const saved = readSavedLocations().map((location) => ({ ...location, shareStatus: "loading" }));
    const current = store.getState().location;
    if (current && !saved.some((location) => isSamePlace(location, current))) {
      return [{ ...current, isFavorite: false, shareStatus: "loading" }, ...saved];
    }
    return saved;
  }

  function persist() {
    writeSavedLocations(locations);
  }

  function updateFilterOptions() {
    const previous = scopeSelect.value || scope;
    clear(scopeSelect);

    const addOption = (value, label, parent = scopeSelect) => {
      const option = el("option", null, label);
      option.value = value;
      parent.append(option);
    };

    addOption(LOCATION_SCOPE_ALL, t("scope.all"));
    addOption(LOCATION_SCOPE_FAVORITES, t("scope.favorites"));

    const { countries, timezones } = getFilterOptions(locations);

    if (countries.length > 0) {
      const group = el("optgroup");
      group.label = t("scope.country");
      for (const option of countries) addOption(option.value, option.label, group);
      scopeSelect.append(group);
    }

    if (timezones.length > 0) {
      const group = el("optgroup");
      group.label = t("scope.timezone");
      for (const option of timezones) addOption(option.value, option.label, group);
      scopeSelect.append(group);
    }

    const exists = [...scopeSelect.options].some((option) => option.value === previous);
    scope = exists ? previous : LOCATION_SCOPE_ALL;
    scopeSelect.value = scope;
  }

  function temperatureLabel(location) {
    return typeof location.temperature === "number"
      ? formatTemperature(location.temperature, store.getState().unit)
      : "—";
  }

  function aqiLabel(location) {
    if (typeof location.aqi !== "number") {
      return { text: t("locations.aqiUnknown"), className: "aqi-tag--unknown" };
    }
    const category = getAqiCategory(location.aqi);
    return {
      text: t("locations.aqiTag", {
        value: Math.round(location.aqi),
        category: category ? getAqiDisplay(category)?.badge : "—",
      }),
      className: `aqi-tag--${category?.key ?? "unknown"}`,
      category,
    };
  }

  function sharePayload(location) {
    return {
      name: getLocationDisplayName(location),
      temperature: location.temperature,
      weatherCode: location.weatherCode,
      aqi: location.aqi,
    };
  }

  function getShareBlockReason(location) {
    if (!isValidLocation(location)) return t("locations.invalidCoords");
    if (location.shareStatus === "loading") return t("locations.loadingData");
    if (location.shareStatus === "error") return t("locations.loadError");

    const validation = validateWeatherShareData(sharePayload(location), store.getState().unit);
    return validation.ok
      ? null
      : t(SHARE_REASON_KEYS[validation.code] ?? "share.err.invalidData");
  }

  function createShareIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "square");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    for (const d of ["M12 16V3", "M7 8l5-5 5 5", "M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"]) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }

  function createShareControl(location) {
    const displayName = getLocationDisplayName(location);
    const label = t("locations.shareLabel", { name: displayName });
    const reason = getShareBlockReason(location);

    if (reason) {
      const disabled = el("button", "icon-button icon-button--share");
      disabled.type = "button";
      disabled.disabled = true;
      disabled.title = reason;
      disabled.setAttribute("aria-label", `${label} (${reason})`);
      disabled.append(createShareIcon());
      return disabled;
    }

    const link = document.createElement("a");
    link.className = "icon-button icon-button--share";
    link.href = buildWeatherShareUrl(sharePayload(location), store.getState().unit ?? "c");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = t("locations.shareVia");
    link.setAttribute("aria-label", label);
    link.append(createShareIcon());
    return link;
  }

  function createRow(location) {
    const active = store.getState().location?.id === location.id;
    const item = el("li", `location-card${active ? " location-card--active" : ""}`);
    item.dataset.id = location.id;

    const main = el("button", "location-card__main");
    main.type = "button";
    main.dataset.action = "select";
    main.setAttribute(
      "aria-label",
      location.country
        ? t("locations.selectAriaWithCountry", {
            name: getLocationDisplayName(location),
            country: location.country,
          })
        : t("locations.selectAria", { name: getLocationDisplayName(location) })
    );

    const titleRow = el("span", "location-card__title-row");
    titleRow.append(el("span", "location-card__name", getLocationDisplayName(location)));
    if (active) titleRow.append(el("span", "location-card__badge", t("locations.active")));
    if (location.isFavorite) titleRow.append(el("span", "location-card__star", "★"));

    const metaParts = [location.admin1, location.country].filter(Boolean);
    const meta = el("span", "location-card__meta", metaParts.join(" · "));
    const zone = el(
      "span",
      "location-card__zone",
      location.timezone && location.timezone !== "auto"
        ? location.timezone
        : t("locations.autoTimezone")
    );

    const metrics = el("span", "location-card__metrics");
    metrics.append(el("span", "location-card__temp", temperatureLabel(location)));
    const aqi = aqiLabel(location);
    metrics.append(el("span", `aqi-tag ${aqi.className}`, aqi.text));
    if (aqi.category) metrics.append(el("span", "sr-only", aqi.category.label));

    main.append(titleRow, meta, zone, metrics);

    const actions = el("span", "location-card__actions");

    const favorite = el("button", "icon-button", location.isFavorite ? "★" : "☆");
    favorite.type = "button";
    favorite.dataset.action = "favorite";
    favorite.setAttribute("aria-pressed", location.isFavorite ? "true" : "false");
    favorite.setAttribute(
      "aria-label",
      location.isFavorite
        ? t("locations.favoriteRemove", { name: getLocationDisplayName(location) })
        : t("locations.favoriteAdd", { name: getLocationDisplayName(location) })
    );

    const remove = el("button", "icon-button icon-button--danger", "×");
    remove.type = "button";
    remove.dataset.action = "remove";
    remove.setAttribute(
      "aria-label",
      t("locations.remove", { name: getLocationDisplayName(location) })
    );

    actions.append(favorite, createShareControl(location), remove);
    item.append(main, actions);
    return item;
  }

  function createEmptyState() {
    const wrapper = el("div", "location-empty");

    if (locations.length === 0) {
      wrapper.append(
        el("p", "location-empty__icon", "☆"),
        el("p", "location-empty__title", t("locations.emptyTitle")),
        el("p", "location-empty__text", t("locations.emptyText"))
      );
      return wrapper;
    }

    wrapper.append(
      el("p", "location-empty__icon", "?"),
      el("p", "location-empty__title", t("locations.noMatchTitle")),
      el("p", "location-empty__text", t("locations.noMatchText"))
    );

    const reset = el("button", "button button--small", t("locations.reset"));
    reset.type = "button";
    reset.addEventListener("click", () => {
      search.reset();
      filterQuery = "";
      scope = LOCATION_SCOPE_ALL;
      sort = "name-asc";
      scopeSelect.value = scope;
      sortSelect.value = sort;
      renderList();
    });
    wrapper.append(reset);
    return wrapper;
  }

  function renderPresets() {
    clear(presetChips);
    presetsLabel.textContent = t("locations.presets");

    for (const preset of KARHUTLA_PRESETS) {
      const saved = Boolean(findSaved(preset));
      const chip = el(
        "button",
        `location-preset${saved ? " location-preset--saved" : ""}`
      );
      chip.type = "button";
      chip.dataset.presetId = preset.id;
      chip.title = saved
        ? t("locations.presetExists", { name: preset.name })
        : t("locations.presetAria", { name: preset.name });
      chip.append(
        el("span", "location-preset__name", preset.name),
        el("span", "location-preset__meta", preset.admin1 ?? preset.country ?? "")
      );
      chip.addEventListener("click", () => addLocation(preset));
      presetChips.append(chip);
    }
  }

  function renderLeaderboard() {
    clear(leaderboard);
    const title = el("h3", "air-leaderboard__title", t("leaderboard.title"));
    leaderboard.append(title);

    const ranking = rankAirQuality(locations);
    if (ranking.ranked.length < 2) {
      leaderboard.append(el("p", "air-leaderboard__empty", t("leaderboard.empty")));
      return;
    }

    const grid = el("div", "air-leaderboard__grid");
    for (const [kind, location] of [
      ["best", ranking.best],
      ["worst", ranking.worst],
    ]) {
      const category = getAqiCategory(location.aqi);
      const display = getAqiDisplay(category);
      const card = el(
        "button",
        `air-leaderboard__card air-leaderboard__card--${kind} aqi-tag--${category?.key ?? "unknown"}`
      );
      card.type = "button";
      card.dataset.leaderboardId = location.id;
      card.setAttribute("aria-label", t("leaderboard.select", { name: getLocationDisplayName(location) }));
      card.append(
        el("span", "air-leaderboard__kind", t(`leaderboard.${kind}`)),
        el("span", "air-leaderboard__name", getLocationDisplayName(location)),
        el("span", "air-leaderboard__aqi", t("leaderboard.aqi", { value: Math.round(location.aqi) })),
        el("span", "air-leaderboard__badge", display?.badge ?? "—")
      );
      card.addEventListener("click", () => selectLocation(location));
      grid.append(card);
    }
    leaderboard.append(grid);
  }

  function renderList() {
    heading.textContent = t("locations.title");
    filterLabel.querySelector(".field__label").textContent = t("locations.filter");
    sortLabel.querySelector(".field__label").textContent = t("locations.sort");
    for (const option of sortSelect.options) {
      option.textContent = t(SORT_LABEL_KEYS[option.value] ?? "sort.nameAsc");
    }
    updateFilterOptions();

    const visible = filterLocations(locations, {
      query: filterQuery,
      scope,
      sort,
    });

    clear(list);
    clear(emptyState);
    const isEmpty = visible.length === 0;
    list.hidden = isEmpty;
    emptyState.hidden = !isEmpty;
    if (isEmpty) {
      emptyState.append(createEmptyState());
    } else {
      for (const location of visible) list.append(createRow(location));
    }

    const favoriteCount = locations.filter((location) => location.isFavorite).length;
    count.textContent = t("locations.count", {
      visible: visible.length,
      total: locations.length,
      favorites: favoriteCount,
    });
    status.textContent =
      visible.length === 0
        ? t("locations.noneShown")
        : t("locations.shown", { count: visible.length });
    hint.textContent = t("locations.hint", { max: MAX_SAVED_LOCATIONS });
    renderPresets();
    renderLeaderboard();
    search.refresh();
  }

  function findLocation(id) {
    return locations.find((location) => location.id === id) ?? null;
  }

  /** Duplikat dicek lewat `id` ATAU koordinat, karena sumber id bisa berbeda. */
  function isSamePlace(a, b) {
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    return (
      Number.isFinite(a.latitude) &&
      Number.isFinite(a.longitude) &&
      Number.isFinite(b.latitude) &&
      Number.isFinite(b.longitude) &&
      Math.abs(a.latitude - b.latitude) < 1e-4 &&
      Math.abs(a.longitude - b.longitude) < 1e-4
    );
  }

  function findSaved(location) {
    return locations.find((entry) => isSamePlace(entry, location)) ?? null;
  }

  /**
   * Lokasi aktif selalu ikut tersimpan agar tidak hilang saat reload, dan
   * entri dengan id/koordinat sama tidak pernah ditambahkan dua kali.
   */
  function selectLocation(location) {
    let entry = findSaved(location);

    if (!entry) {
      entry = { ...location, isFavorite: false, shareStatus: "ready" };
      if (locations.length < MAX_SAVED_LOCATIONS) {
        locations = [...locations, entry];
        persist();
        renderList();
      }
    }

    const active = entry ?? location;
    store.setState({ location: { ...active }, isSampleLocation: false });
    writeLastLocation(active);
  }

  async function enrich(location) {
    const [forecast, airQuality] = await Promise.all([
      weatherService.loadForecast(location),
      weatherService.loadAirQuality(location),
    ]);

    const target = findLocation(location.id);
    if (!target) return;

    target.temperature = forecast.weather?.current?.temperature ?? null;
    target.weatherCode = forecast.weather?.current?.weatherCode ?? null;
    target.aqi = airQuality.airQuality?.aqi ?? null;
    target.dataStatus = forecast.error ? "error" : "ready";
    target.shareStatus = forecast.error || airQuality.error ? "error" : "ready";
    renderList();
  }

  function addLocation(location) {
    const existing = findSaved(location);
    if (existing) {
      selectLocation(existing);
      return;
    }

    if (locations.length >= MAX_SAVED_LOCATIONS) {
      status.textContent = t("locations.maxReached", { max: MAX_SAVED_LOCATIONS });
      return;
    }

    selectLocation(location);
    const entry = findSaved(location);
    if (entry) enrich(entry);
  }

  function handleSearchSelect(location) {
    addLocation(location);
  }

  list.addEventListener("click", (event) => {
    const item = event.target.closest(".location-card");
    if (!item) return;
    const location = findLocation(item.dataset.id);
    if (!location) return;

    /* Tautan bagikan punya aksi sendiri (membuka WhatsApp), jangan ikut
       mengganti lokasi aktif saat klik menggelembung ke kartu. */
    if (event.target.closest("a")) return;

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "favorite") {
      location.isFavorite = !location.isFavorite;
      persist();
      renderList();
      return;
    }
    if (action === "remove") {
      locations = locations.filter((entry) => entry.id !== location.id);
      persist();
      renderList();
      return;
    }
    selectLocation(location);
  });

  scopeSelect.addEventListener("change", () => {
    scope = scopeSelect.value;
    renderList();
  });

  sortSelect.addEventListener("change", () => {
    sort = sortSelect.value;
    renderList();
  });

  const unsubscribe = store.subscribe(() => renderList());

  updateFilterOptions();
  renderList();
  /* Enrich hanya beberapa kartu pertama saat boot: menghindari 2 request per
     lokasi tersimpan sekaligus (maksimal 20 lokasi). */
  for (const location of locations.slice(0, 4)) enrich(location);

  return {
    element: section,
    search,
    useLocation(location) {
      addLocation(location);
      const entry = findSaved(location);
      if (entry) enrich(entry);
    },
    destroy() {
      unsubscribe();
      section.remove();
    },
  };
}
