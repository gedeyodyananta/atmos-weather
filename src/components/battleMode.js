/**
 * Battle Mode: bandingkan udara dua kota tanpa mengubah kota aktif.
 * Forecast & AQI diambil lewat method per-location milik weatherService agar
 * snapshot dashboard utama tetap utuh dan cache tetap dipakai.
 */

import { KARHUTLA_PRESETS } from "../config/constants.js";
import { readSavedLocations } from "../core/storage.js";
import { t } from "../i18n/index.js";
import { weatherService } from "../services/weatherService.js";
import { getAqiCategory, getAqiDisplay } from "../utils/aqi.js";
import { buildBattleCandidates, compareFighters, pickOpponent } from "../utils/duel.js";
import { formatNumber, formatTemperature } from "../utils/format.js";
import { getLocationDisplayName } from "../utils/locationName.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { createOverlay } from "./overlay.js";

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function optionLabel(location) {
  const place = [location.admin1, location.country].filter(Boolean).join(", ");
  return place ? `${getLocationDisplayName(location)} — ${place}` : getLocationDisplayName(location);
}

function aqiLabel(airQuality) {
  return typeof airQuality?.aqi === "number" ? Math.round(airQuality.aqi) : "—";
}

function categoryFor(airQuality) {
  return typeof airQuality?.aqi === "number" ? getAqiCategory(airQuality.aqi) : null;
}

function formatMetricValue(row) {
  if (row.a === null && row.b === null) return ["—", "—"];
  const decimals = row.key === "aqi" ? 0 : 1;
  return [
    row.a === null ? "—" : formatNumber(row.a, decimals),
    row.b === null ? "—" : formatNumber(row.b, decimals),
  ];
}

function renderFighter(side, fighter, unit = "c") {
  const location = fighter.location;
  const current = fighter.weather?.current;
  const category = categoryFor(fighter.airQuality);
  const display = category ? getAqiDisplay(category) : null;
  const card = node("article", "duel__side");
  card.dataset.level = category?.key ?? "unknown";
  card.dataset.side = side;

  card.append(node("p", "duel__side-label", side === "a" ? t("battle.cityA") : t("battle.cityB")));
  card.append(node("h3", "duel__city", getLocationDisplayName(location)));
  card.append(
    node(
      "p",
      "duel__place",
      [location.admin1, location.country].filter(Boolean).join(" · ") || "—"
    )
  );

  const readout = node("div", "duel__readout");
  const aqi = node("p", "duel__aqi", aqiLabel(fighter.airQuality));
  readout.append(aqi, node("span", "duel__aqi-scale", t("battle.aqiScale")));
  if (display) readout.append(node("span", "duel__category", display.badge));
  card.append(readout);

  if (current) {
    card.append(
      node(
        "p",
        "duel__weather",
        `${formatTemperature(current.temperature, unit)} · ${getWeatherConditionLabel(current.weatherCode)}`
      )
    );
  } else {
    card.append(node("p", "duel__weather", t("battle.noWeather")));
  }

  if (fighter.error) {
    card.append(node("p", "duel__warning", t("battle.partialError")));
  }

  return card;
}

function renderTable(result) {
  const table = node("table", "duel-table");
  const caption = node("caption", "sr-only", t("battle.tableCaption"));
  table.append(caption);

  const head = node("thead");
  const headRow = node("tr");
  headRow.append(
    node("th", null, t("battle.metric")),
    node("th", null, t("battle.cityA")),
    node("th", null, t("battle.cityB"))
  );
  head.append(headRow);
  table.append(head);

  const body = node("tbody");
  for (const row of result.rows) {
    const tr = node("tr");
    if (row.winner === "tie") tr.className = "duel-table__row--tie";
    const [a, b] = formatMetricValue(row);
    const header = node("th", null, t(row.labelKey));
    header.scope = "row";
    if (row.unit) header.append(node("span", "duel-table__unit", row.unit));

    const cellA = node("td", row.winner === "a" ? "duel-table__cell--winner" : null);
    const cellB = node("td", row.winner === "b" ? "duel-table__cell--winner" : null);
    cellA.append(node("span", "duel-table__value", a));
    cellB.append(node("span", "duel-table__value", b));
    if (row.winner === "a") cellA.append(node("span", "sr-only", t("battle.winner")));
    if (row.winner === "b") cellB.append(node("span", "sr-only", t("battle.winner")));
    if (row.winner === "tie") {
      cellA.append(node("span", "duel-table__tie", "="));
      cellB.append(node("span", "duel-table__tie", "="));
    }

    tr.append(header, cellA, cellB);
    body.append(tr);
  }
  table.append(body);
  return table;
}

export function createBattleMode({ store, notify } = {}) {
  const overlay = createOverlay({
    className: "overlay--battle",
    eyebrow: t("battle.eyebrow"),
    title: t("battle.title"),
    size: "lg",
    onClose: () => abort(),
  });

  const root = node("div", "battle");
  const setup = node("div", "battle__setup");
  const fieldA = node("label", "battle__field");
  const selectA = node("select", "battle__select");
  selectA.id = "battle-city-a";
  fieldA.append(node("span", "battle__field-label", t("battle.cityA")), selectA);

  const swap = node("button", "battle__swap", "⇄");
  swap.type = "button";
  swap.setAttribute("aria-label", t("battle.swap"));
  swap.title = t("battle.swap");

  const fieldB = node("label", "battle__field");
  const selectB = node("select", "battle__select");
  selectB.id = "battle-city-b";
  fieldB.append(node("span", "battle__field-label", t("battle.cityB")), selectB);
  setup.append(fieldA, swap, fieldB);

  const actionRow = node("div", "battle__actions");
  const status = node("p", "battle__status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const fight = node("button", "button", t("battle.fight"));
  fight.type = "button";
  actionRow.append(status, fight);

  const hint = node("p", "battle__hint", t("battle.hint"));
  const arena = node("div", "battle__arena");
  root.append(setup, actionRow, hint, arena);
  overlay.body.append(root);

  let candidates = [];
  let controller = null;
  let sequence = 0;
  let selectedAId = null;
  let selectedBId = null;

  function refreshCandidates() {
    const active = store.getState().location;
    candidates = buildBattleCandidates({
      active,
      saved: readSavedLocations(),
      presets: KARHUTLA_PRESETS,
    });

    const previousA = selectedAId ?? selectA.value;
    const previousB = selectedBId ?? selectB.value;
    selectA.replaceChildren();
    selectB.replaceChildren();

    for (const location of candidates) {
      const option = node("option", null, optionLabel(location));
      option.value = location.id;
      selectA.append(option.cloneNode(true));
      selectB.append(option);
    }

    const activeId = active?.id;
    selectedAId = candidates.some((location) => location.id === previousA)
      ? previousA
      : candidates.some((location) => location.id === activeId)
        ? activeId
        : candidates[0]?.id ?? null;
    const opponent = pickOpponent(candidates, selectedAId);
    selectedBId =
      candidates.some((location) => location.id === previousB) && previousB !== selectedAId
        ? previousB
        : opponent?.id ?? null;

    selectA.value = selectedAId ?? "";
    selectB.value = selectedBId ?? "";
  }

  function selectedLocation(id) {
    return candidates.find((location) => location.id === id) ?? null;
  }

  function abort() {
    sequence += 1;
    controller?.abort();
    controller = null;
  }

  async function fetchFighter(location, signal) {
    const [forecast, airQuality] = await Promise.all([
      weatherService.loadForecast(location, { signal }),
      weatherService.loadAirQuality(location, { signal }),
    ]);
    return {
      location,
      weather: forecast.weather,
      airQuality: airQuality.airQuality,
      error: forecast.error ?? airQuality.error ?? null,
      aborted: forecast.aborted || airQuality.aborted,
    };
  }

  function renderLoading(a, b) {
    arena.replaceChildren();
    const loading = node("div", "battle__loading");
    loading.append(
      node("p", "battle__loading-title", t("battle.loading")),
      node("p", "battle__loading-copy", `${getLocationDisplayName(a)} vs ${getLocationDisplayName(b)}`)
    );
    arena.append(loading);
  }

  function renderUnavailable() {
    arena.replaceChildren(node("p", "battle__empty", t("battle.noData")));
  }

  function renderResult(a, b) {
    const result = compareFighters(a, b);
    const unit = store.getState().unit ?? "c";
    arena.replaceChildren();

    const board = node("div", "duel");
    const top = node("div", "duel__top");
    top.append(renderFighter("a", a, unit));

    const versus = node("div", "duel__versus");
    versus.append(
      node("span", "duel__vs", "VS"),
      node(
        "span",
        "duel__score",
        `${result.score.a} : ${result.score.b}`
      )
    );
    if (result.winner === "tie") versus.append(node("span", "duel__verdict", t("battle.draw")));
    else if (result.winner !== "none") {
      const winner = result.winner === "a" ? a : b;
      versus.append(
        node(
          "span",
          "duel__verdict",
          t("battle.wins", { name: getLocationDisplayName(winner.location) })
        )
      );
    } else {
      versus.append(node("span", "duel__verdict", t("battle.noData")));
    }

    top.append(versus, renderFighter("b", b, unit));
    board.append(top);

    if (result.score.compared > 0) board.append(renderTable(result));
    else board.append(node("p", "battle__empty", t("battle.noComparable")));

    const footer = node("p", "battle__footnote", t("battle.footnote"));
    board.append(footer);
    arena.append(board);
  }

  async function fightNow() {
    const a = selectedLocation(selectedAId);
    const b = selectedLocation(selectedBId);
    if (!a || !b) {
      arena.replaceChildren(node("p", "battle__empty", t("battle.chooseBoth")));
      return;
    }
    if (a.id === b.id) {
      arena.replaceChildren(node("p", "battle__empty", t("battle.sameCity")));
      return;
    }

    abort();
    const mySequence = sequence;
    controller = new AbortController();
    fight.disabled = true;
    status.textContent = t("battle.loading");
    renderLoading(a, b);

    try {
      const [left, right] = await Promise.all([
        fetchFighter(a, controller.signal),
        fetchFighter(b, controller.signal),
      ]);
      if (mySequence !== sequence) return;
      if (left.aborted || right.aborted) return;

      if (!left.weather && !left.airQuality && !right.weather && !right.airQuality) {
        renderUnavailable();
        status.textContent = t("battle.noData");
        return;
      }

      renderResult(left, right);
      if (left.error || right.error) status.textContent = t("battle.partialError");
      else status.textContent = t("battle.ready");
      if (left.error || right.error) notify?.(t("battle.partialError"));
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (mySequence !== sequence) return;
      renderUnavailable();
      status.textContent = t("battle.loadError");
      notify?.(t("battle.loadError"));
    } finally {
      if (mySequence === sequence) fight.disabled = false;
    }
  }

  selectA.addEventListener("change", () => {
    selectedAId = selectA.value || null;
  });
  selectB.addEventListener("change", () => {
    selectedBId = selectB.value || null;
  });

  fight.addEventListener("click", fightNow);
  swap.addEventListener("click", () => {
    const first = selectedAId;
    selectedAId = selectedBId;
    selectedBId = first;
    selectA.value = selectedAId ?? "";
    selectB.value = selectedBId ?? "";
    fightNow();
  });

  return {
    open() {
      overlay.setTitle(t("battle.title"));
      overlay.setEyebrow(t("battle.eyebrow"));
      fieldA.querySelector(".battle__field-label").textContent = t("battle.cityA");
      fieldB.querySelector(".battle__field-label").textContent = t("battle.cityB");
      swap.setAttribute("aria-label", t("battle.swap"));
      swap.title = t("battle.swap");
      fight.textContent = t("battle.fight");
      hint.textContent = t("battle.hint");
      refreshCandidates();
      overlay.open({ focus: () => selectA });
      if (candidates.length < 2) {
        arena.replaceChildren(node("p", "battle__empty", t("battle.needTwo")));
        status.textContent = t("battle.needTwo");
        return;
      }
      fightNow();
    },
    close() {
      abort();
      overlay.close();
    },
    element: overlay.root,
  };
}
