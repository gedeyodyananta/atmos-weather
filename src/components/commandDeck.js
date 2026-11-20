/**
 * Command Deck: palette tindakan, shortcut keyboard, dan diagnostik lokal.
 * Command hanya memanggil API/browser yang sudah dipakai dashboard.
 */

import { readSavedLocations } from "../core/storage.js";
import { t } from "../i18n/index.js";
import { weatherService } from "../services/weatherService.js";
import { getLocationDisplayName } from "../utils/locationName.js";
import { createOverlay, isOverlayOpen } from "./overlay.js";

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function isTypingTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function matches(command, query) {
  if (!query) return true;
  const haystack = [command.label, command.detail, command.key].join(" ").toLocaleLowerCase();
  return haystack.includes(query);
}

export function createCommandDeck({
  store,
  onThemeChange,
  onOpenAirgram,
  onOpenBattle,
  onFocusSearch,
  onRefresh,
  notify,
} = {}) {
  const overlay = createOverlay({
    className: "overlay--command",
    eyebrow: "ATMOS / COMMAND DECK",
    title: t("command.title"),
    size: "sm",
  });

  const root = node("div", "command");
  const bar = node("div", "command__bar");
  bar.append(node("span", "command__prompt", ">"));
  const input = document.createElement("input");
  input.className = "command__input";
  input.type = "search";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = t("command.placeholder");
  input.setAttribute("aria-label", t("command.inputAria"));
  bar.append(input);
  root.append(bar);

  const status = node("p", "command__status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.append(status);

  const list = node("div", "command__list");
  list.setAttribute("role", "list");
  root.append(list);

  const diagnostics = node("pre", "command__diagnostics");
  diagnostics.hidden = true;
  root.append(diagnostics);

  const footer = node("div", "command__footer");
  const footerItems = [
    node("span", null, t("command.footerNav")),
    node("span", null, t("command.footerRun")),
    node("span", null, t("command.footerClose")),
    node("span", null, t("command.footerHelp")),
  ];
  footer.append(...footerItems);
  root.append(footer);
  overlay.body.append(root);

  let activeIndex = 0;
  let visibleCommands = [];
  let showDiagnostics = false;

  function theme() {
    return store.getState().theme === "blackout" ? "blackout" : "paper";
  }

  function commands() {
    const blackout = theme() === "blackout";
    return [
      {
        id: "search",
        label: t("command.search"),
        detail: t("command.searchHint"),
        key: "/",
        run: onFocusSearch,
      },
      {
        id: "airgram",
        label: t("command.airgram"),
        detail: t("command.airgramHint"),
        key: "A",
        run: onOpenAirgram,
      },
      {
        id: "battle",
        label: t("command.battle"),
        detail: t("command.battleHint"),
        key: "B",
        run: onOpenBattle,
      },
      {
        id: "refresh",
        label: t("command.refresh"),
        detail: t("command.refreshHint"),
        key: "R",
        run: onRefresh,
      },
      {
        id: "theme",
        label: blackout ? t("command.themePaper") : t("command.themeBlackout"),
        detail: t("command.themeHint"),
        key: "T",
        run: () => onThemeChange?.(blackout ? "paper" : "blackout"),
      },
      {
        id: "diagnostics",
        label: showDiagnostics ? t("command.diagHide") : t("command.diagShow"),
        detail: t("command.diagHint"),
        stayOpen: true,
        run: () => {
          showDiagnostics = !showDiagnostics;
          diagnostics.hidden = !showDiagnostics;
          renderDiagnostics();
          renderList();
        },
      },
      {
        id: "dashboard",
        label: t("command.dashboard"),
        detail: t("command.dashboardHint"),
        key: "G",
        run: () => {
          document.querySelector("#app-main")?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      },
    ];
  }

  function renderDiagnostics() {
    if (!showDiagnostics) {
      diagnostics.textContent = "";
      return;
    }
    const state = store.getState();
    const snapshot = weatherService.getSnapshot();
    const saved = readSavedLocations();
    diagnostics.textContent = [
      `ATMOS // SYSTEM STATUS`,
      `location    ${getLocationDisplayName(state.location)}`,
      `coordinates ${state.location?.latitude ?? "—"}, ${state.location?.longitude ?? "—"}`,
      `forecast    ${snapshot.status}`,
      `air quality ${snapshot.airQualityStatus}`,
      `cache       forecast=${snapshot.fromCache?.forecast ? "hit" : "miss"} · aqi=${snapshot.fromCache?.airQuality ? "hit" : "miss"}`,
      `unit/locale ${state.unit ?? "c"} / ${state.locale ?? "id"}`,
      `theme       ${theme()}`,
      `saved       ${saved.length}`,
    ].join("\n");
  }

  function commandButton(command, index) {
    const button = node("button", "command__item");
    button.type = "button";
    button.dataset.index = String(index);
    button.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
    if (index === activeIndex) button.classList.add("is-active");

    const copy = node("span", "command__copy");
    copy.append(node("span", "command__label", command.label));
    copy.append(node("span", "command__detail", command.detail));
    button.append(copy);
    if (command.key) button.append(node("kbd", "command__key", command.key));
    button.addEventListener("click", () => execute(command));
    return button;
  }

  function renderList() {
    const query = input.value.trim().toLocaleLowerCase();
    visibleCommands = commands().filter((command) => matches(command, query));
    activeIndex = Math.min(activeIndex, Math.max(0, visibleCommands.length - 1));

    list.replaceChildren();
    if (visibleCommands.length === 0) {
      list.append(node("p", "command__empty", t("command.noMatch")));
      status.textContent = t("command.noResults");
      return;
    }

    visibleCommands.forEach((command, index) => list.append(commandButton(command, index)));
    status.textContent = t("command.results", { count: visibleCommands.length });
  }

  function execute(command) {
    if (!command) return;
    if (command.stayOpen) {
      command.run?.();
      return;
    }
    overlay.close();
    command.run?.();
  }

  function open() {
    overlay.setTitle(t("command.title"));
    overlay.setEyebrow("ATMOS / COMMAND DECK");
    input.placeholder = t("command.placeholder");
    input.setAttribute("aria-label", t("command.inputAria"));
    footerItems[0].textContent = t("command.footerNav");
    footerItems[1].textContent = t("command.footerRun");
    footerItems[2].textContent = t("command.footerClose");
    footerItems[3].textContent = t("command.footerHelp");
    activeIndex = 0;
    input.value = "";
    showDiagnostics = false;
    diagnostics.hidden = true;
    renderList();
    overlay.open({ focus: () => input });
  }

  function close() {
    overlay.close();
  }

  input.addEventListener("input", () => {
    activeIndex = 0;
    renderList();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (visibleCommands.length === 0) return;
      activeIndex = (activeIndex + 1) % visibleCommands.length;
      renderList();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (visibleCommands.length === 0) return;
      activeIndex = (activeIndex - 1 + visibleCommands.length) % visibleCommands.length;
      renderList();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      execute(visibleCommands[activeIndex]);
    }
  });

  function onGlobalKeydown(event) {
    if (event.defaultPrevented) return;

    const key = event.key.toLowerCase();
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && key === "k") {
      event.preventDefault();
      open();
      return;
    }

    if (isOverlayOpen() || isTypingTarget(event.target) || event.altKey) return;

    if (event.key === "?") {
      event.preventDefault();
      open();
      return;
    }

    if (event.key === "Escape") return;
    if (event.metaKey || event.ctrlKey) return;

    if (event.key === "/") {
      event.preventDefault();
      onFocusSearch?.();
    } else if (key === "a") {
      event.preventDefault();
      onOpenAirgram?.();
    } else if (key === "b") {
      event.preventDefault();
      onOpenBattle?.();
    } else if (key === "r") {
      event.preventDefault();
      onRefresh?.();
      notify?.(t("status.refreshing"));
    } else if (key === "t") {
      event.preventDefault();
      onThemeChange?.(theme() === "blackout" ? "paper" : "blackout");
    } else if (key === "g") {
      event.preventDefault();
      document.querySelector("#app-main")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  document.addEventListener("keydown", onGlobalKeydown);

  return {
    open,
    close,
    element: overlay.root,
    destroy() {
      document.removeEventListener("keydown", onGlobalKeydown);
      overlay.close();
    },
  };
}
