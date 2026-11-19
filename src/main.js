import "./style.css";
import { createStore } from "./store.js";
import { createUI } from "./ui.js";

const store = createStore({
  location: null,
  unit: "c",
  favorites: [],
  status: "idle",
});

const ui = createUI(document.querySelector("#app"));

ui.render(store.getState());
store.subscribe((state) => ui.render(state));
