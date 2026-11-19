import "./style.css";
import { createInitialState, createStore } from "./core/store.js";
import { writePreferences } from "./core/storage.js";
import { createUI } from "./ui.js";
import { createWeatherDashboard } from "./components/weatherDashboard.js";
import { createLocationExplorer } from "./components/locationExplorer.js";

const store = createStore(createInitialState());

const ui = createUI(document.querySelector("#app"), {
  onUnitChange(unit) {
    const preferences = { unit };
    writePreferences(preferences);
    store.setState({ unit, preferences });
  },
});

ui.render(store.getState());
store.subscribe((state) => ui.render(state));

const dashboard = createWeatherDashboard({ store });
ui.main.append(dashboard.element);

const explorer = createLocationExplorer({ store });
ui.main.append(explorer.element);
