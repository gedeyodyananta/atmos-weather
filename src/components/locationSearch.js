/**
 * Input pencarian kota + dropdown autocomplete (UI-SPEC §12).
 * Debounce 350 ms, minimal 2 karakter, maksimal 8 hasil dari Open-Meteo
 * Geocoding, request usang dibatalkan lewat AbortController.
 */

import { searchLocations } from "../api/geocoding.js";
import { getLocale, t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;
const LISTBOX_ID = "city-search-results";

export function createLocationSearch({ onSelect, onQueryChange } = {}) {
  const root = el("div", "city-search");

  const label = el("label", "city-search__label", t("search.label"));
  label.htmlFor = "city-search-input";

  const input = document.createElement("input");
  input.id = "city-search-input";
  input.className = "city-search__input";
  input.type = "search";
  input.placeholder = t("search.placeholder");
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", LISTBOX_ID);
  input.setAttribute("aria-autocomplete", "list");

  const clearButton = el("button", "city-search__clear", "×");
  clearButton.type = "button";
  clearButton.hidden = true;
  clearButton.setAttribute("aria-label", t("search.clear"));

  const field = el("div", "city-search__field");
  field.append(input, clearButton);

  const feedback = el("div", "city-search__feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  const list = el("ul", "city-search__results");
  list.id = LISTBOX_ID;
  list.setAttribute("role", "listbox");
  list.hidden = true;

  root.append(label, field, feedback, list);

  let results = [];
  let activeIndex = -1;
  let state = "hint";
  let currentQuery = "";
  let request = null;
  let token = 0;
  let debounceTimer = null;
  let dismissed = false;

  function setState(next) {
    state = next;
    render();
  }

  function optionId(index) {
    return `city-search-option-${index}`;
  }

  function renderFeedback() {
    clear(feedback);

    if (state === "hint") {
      /* Di header, petunjuk awal cukup lewat placeholder agar tidak ada
         gelembung status yang selalu menempel di bawah input. */
      if (!root.closest(".header-search")) {
        feedback.append(el("span", "city-search__hint", t("search.hint")));
      }
      return;
    }
    if (state === "loading") {
      feedback.append(el("span", "city-search__hint", t("search.loading")));
      return;
    }
    if (state === "empty") {
      feedback.append(el("span", "city-search__empty", t("search.empty")));
      return;
    }
    if (state === "error") {
      feedback.append(el("span", "city-search__error", t("search.error")));
      const retry = el("button", "button button--small", t("search.retry"));
      retry.type = "button";
      retry.addEventListener("click", () => run(currentQuery));
      feedback.append(retry);
      return;
    }
    if (state === "ready") {
      feedback.append(
        el("span", "city-search__hint", t("search.results", { count: results.length }))
      );
    }
  }

  function renderList() {
    clear(list);
    const isOpen = !dismissed && results.length > 0 && (state === "ready" || state === "loading");
    list.hidden = !isOpen;
    input.setAttribute("aria-expanded", isOpen ? "true" : "false");

    if (!isOpen) {
      input.removeAttribute("aria-activedescendant");
      return;
    }

    results.forEach((location, index) => {
      const item = el("li", "city-search__option");
      item.id = optionId(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
      item.dataset.index = String(index);

      const place = el("span", "city-search__place", location.name);
      const metaParts = [location.admin1, location.country].filter(Boolean);
      const meta = el("span", "city-search__meta", metaParts.join(", "));
      item.append(place, meta);

      list.append(item);
    });

    if (activeIndex >= 0 && activeIndex < results.length) {
      input.setAttribute("aria-activedescendant", optionId(activeIndex));
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function render() {
    label.textContent = t("search.label");
    input.placeholder = t("search.placeholder");
    clearButton.setAttribute("aria-label", t("search.clear"));
    renderFeedback();
    renderList();
  }

  function abortRequest() {
    token += 1;
    if (request) {
      request.abort();
      request = null;
    }
  }

  async function run(query) {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    clearTimeout(debounceTimer);
    abortRequest();
    currentQuery = trimmed;
    dismissed = false;
    request = new AbortController();
    const myToken = token;
    setState("loading");

    try {
      const found = await searchLocations(trimmed, {
        signal: request.signal,
        language: getLocale(),
      });
      if (myToken !== token) return;
      results = found;
      activeIndex = -1;
      setState(found.length > 0 ? "ready" : "empty");
    } catch (error) {
      if (myToken !== token) return;
      if (error?.code === "ABORTED" || error?.name === "AbortError") return;
      results = [];
      activeIndex = -1;
      setState("error");
    }
  }

  function schedule(query) {
    clearTimeout(debounceTimer);
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRequest();
      results = [];
      activeIndex = -1;
      dismissed = false;
      setState("hint");
      return;
    }
    debounceTimer = setTimeout(() => run(trimmed), DEBOUNCE_MS);
  }

  function select(index) {
    const location = results[index];
    if (!location) return;

    onSelect?.(location);
    input.value = "";
    currentQuery = "";
    onQueryChange?.("");
    clearButton.hidden = true;
    abortRequest();
    results = [];
    activeIndex = -1;
    dismissed = false;
    setState("hint");
    input.focus();
  }

  input.addEventListener("input", () => {
    const query = input.value;
    clearButton.hidden = query.length === 0;
    dismissed = false;
    onQueryChange?.(query);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      results = [];
      activeIndex = -1;
    }
    schedule(query);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      if (results.length === 0 || dismissed) return;
      event.preventDefault();
      activeIndex = (activeIndex + 1) % results.length;
      render();
      return;
    }
    if (event.key === "ArrowUp") {
      if (results.length === 0 || dismissed) return;
      event.preventDefault();
      activeIndex = activeIndex <= 0 ? results.length - 1 : activeIndex - 1;
      render();
      return;
    }
    if (event.key === "Enter") {
      if (activeIndex >= 0 && results.length > 0 && !dismissed) {
        event.preventDefault();
        select(activeIndex);
      }
      return;
    }
    if (event.key === "Escape") {
      dismissed = true;
      activeIndex = -1;
      render();
      input.focus();
    }
  });

  list.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  list.addEventListener("mousemove", (event) => {
    const item = event.target.closest('[role="option"]');
    if (!item) return;
    const index = Number(item.dataset.index);
    if (Number.isInteger(index) && index !== activeIndex) {
      activeIndex = index;
      renderList();
    }
  });

  list.addEventListener("click", (event) => {
    const item = event.target.closest('[role="option"]');
    if (!item) return;
    select(Number(item.dataset.index));
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    clearButton.hidden = true;
    abortRequest();
    results = [];
    activeIndex = -1;
    dismissed = false;
    onQueryChange?.("");
    setState("hint");
    input.focus();
  });

  root.addEventListener("focusout", (event) => {
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    dismissed = true;
    activeIndex = -1;
    render();
  });

  render();

  return {
    element: root,
    refresh() {
      render();
    },
    reset() {
      input.value = "";
      clearButton.hidden = true;
      abortRequest();
      results = [];
      activeIndex = -1;
      dismissed = false;
      onQueryChange?.("");
      setState("hint");
    },
    focus() {
      input.focus();
    },
  };
}
