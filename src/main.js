import "./style.css";
import { createInitialState, createStore } from "./core/store.js";
import { createUI } from "./ui.js";
import { createLocationExplorer } from "./components/locationExplorer.js";

const store = createStore(createInitialState());

const ui = createUI(document.querySelector("#app"));

ui.render(store.getState());
store.subscribe((state) => ui.render(state));

const explorer = createLocationExplorer({ store });
document.querySelector(".app-main").append(explorer.element);
