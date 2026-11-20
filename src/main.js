import "./style.css";
import { createInitialState, createStore } from "./core/store.js";
import { writePreferences } from "./core/storage.js";
import { writeTheme } from "./core/theme.js";
import { setLocale, t } from "./i18n/index.js";
import { weatherService } from "./services/weatherService.js";
import { createUI } from "./ui.js";
import { createAirgram } from "./components/airgram.js";
import { createBattleMode } from "./components/battleMode.js";
import { createCommandDeck } from "./components/commandDeck.js";
import { createWeatherDashboard } from "./components/weatherDashboard.js";
import { createLocationExplorer } from "./components/locationExplorer.js";
import { createStatusBar } from "./components/statusBar.js";
import { createTicker } from "./components/ticker.js";
import { getCurrentPosition, mapGeolocationError } from "./utils/geolocation.js";

const initialState = createInitialState();
const store = createStore(initialState);
setLocale(store.getState().locale);
document.documentElement.lang = store.getState().locale;
document.documentElement.dataset.theme = initialState.theme;

let airgram;
let battle;
let commandDeck;

function openAirgram() {
  battle?.close();
  commandDeck?.close();
  airgram?.open();
}

function openBattle() {
  airgram?.close();
  commandDeck?.close();
  battle?.open();
}

function setTheme(theme) {
  const next = theme === "blackout" ? "blackout" : "paper";
  writeTheme(next);
  store.setState({ theme: next });
}

function refreshActiveLocation() {
  const location = store.getState().location;
  if (location) weatherService.load(location, { force: true });
}

const ui = createUI(document.querySelector("#app"), {
  onUnitChange(unit) {
    const preferences = { unit, locale: store.getState().locale };
    writePreferences(preferences);
    store.setState({ unit, preferences });
  },
  onLanguageChange(locale) {
    const preferences = { unit: store.getState().unit, locale };
    writePreferences(preferences);
    store.setState({ locale, preferences });
  },
  onLocate() {
    handleLocate();
  },
  onCommand() {
    commandDeck?.open();
  },
});

ui.render(store.getState());

/* Subscriber pertama: pastikan bahasa aktif sebelum komponen lain merender. */
store.subscribe((state) => {
  setLocale(state.locale);
  document.documentElement.lang = state.locale;
  ui.render(state);
});

const dashboard = createWeatherDashboard({
  store,
  onOpenAirgram: openAirgram,
});
ui.main.append(dashboard.element);

const explorer = createLocationExplorer({
  store,
  onOpenBattle: openBattle,
});
ui.searchSlot.append(explorer.search.element);
ui.main.append(explorer.element);

ui.statusHost.append(createStatusBar({ store }).element);
ui.tickerHost.append(createTicker({ store }).element);

airgram = createAirgram({ store, notify: ui.notify });
battle = createBattleMode({ store, notify: ui.notify });
commandDeck = createCommandDeck({
  store,
  onThemeChange: setTheme,
  onOpenAirgram: openAirgram,
  onOpenBattle: openBattle,
  onFocusSearch: () => explorer.search.focus(),
  onRefresh: refreshActiveLocation,
  notify: ui.notify,
});

async function handleLocate() {
  if (!globalThis.navigator?.geolocation) {
    ui.notify(t("geo.unsupported"));
    return;
  }

  ui.setLocating(true);
  try {
    const position = await getCurrentPosition();
    const latitude = Number(position.latitude.toFixed(4));
    const longitude = Number(position.longitude.toFixed(4));

    explorer.useLocation({
      id: `custom:${latitude},${longitude}`,
      name: t("geo.name"),
      admin1: "",
      country: "",
      latitude,
      longitude,
      timezone: "auto",
    });
    ui.notify(t("geo.success"));
  } catch (error) {
    const key = error?.key ?? mapGeolocationError(error);
    ui.notify(t(key));
  } finally {
    ui.setLocating(false);
  }
}
