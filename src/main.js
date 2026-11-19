import "./style.css";
import { createInitialState, createStore } from "./core/store.js";
import { createUI } from "./ui.js";
import { createWeatherDashboard } from "./components/weatherDashboard.js";
import { createLocationExplorer } from "./components/locationExplorer.js";

const store = createStore(createInitialState());

const ui = createUI(document.querySelector("#app"));

ui.render(store.getState());
store.subscribe((state) => ui.render(state));

const dashboard = createWeatherDashboard({ store });
ui.main.append(dashboard.element);

const explorer = createLocationExplorer({ store });
ui.main.append(explorer.element);
