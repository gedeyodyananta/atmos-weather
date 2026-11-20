/**
 * Hero status kabut asap: AQI, masker, izin aktivitas, kelompok sensitif,
 * dan estimasi paparan rokok. Warna latar mengikuti tingkat AQI lewat
 * `data-level`; teks tetap memakai kontras tinggi.
 */

import { t } from "../i18n/index.js";
import { getAqiCategory, getAqiDisplay } from "../utils/aqi.js";
import { clear, el } from "../utils/dom.js";
import { getCigaretteEquivalent } from "../utils/exposure.js";
import { formatClock, formatNumber } from "../utils/format.js";
import { getHealthAdvisory } from "../utils/healthAdvisory.js";
import { getLocationDisplayName } from "../utils/locationName.js";

function createSkeleton() {
  const skeleton = el("div", "haze-hero__skeleton");
  skeleton.append(
    el("div", "skeleton skeleton--haze-value"),
    el("div", "skeleton skeleton--line"),
    el("div", "skeleton skeleton--line skeleton--short")
  );
  return skeleton;
}

function createRetry(view) {
  const block = el("div", "haze-hero__error");
  block.append(el("p", null, t("haze.unavailable")));
  if (typeof view.onRetryAqi === "function") {
    const button = el("button", "button button--small", t("aqi.retry"));
    button.type = "button";
    button.addEventListener("click", view.onRetryAqi);
    block.append(button);
  }
  return block;
}

function createFact(label, value, className = "") {
  const fact = el("div", `haze-fact${className ? ` ${className}` : ""}`);
  fact.append(el("p", "haze-fact__label", label), el("p", "haze-fact__value", value));
  return fact;
}

export function createHazeHero({ onOpenAirgram } = {}) {
  const element = el("section", "panel haze-hero");
  element.setAttribute("aria-labelledby", "haze-title");
  element.dataset.level = "unknown";

  function update(view) {
    clear(element);
    const aqi = view.airQuality?.aqi;
    const category = typeof aqi === "number" ? getAqiCategory(aqi) : null;
    element.dataset.level = category?.key ?? "unknown";

    const head = el("div", "haze-hero__head");
    const heading = el("div", "haze-hero__heading");
    heading.append(
      el("p", "haze-hero__eyebrow", t("haze.eyebrow")),
      el("h2", "haze-hero__title", t("haze.title"))
    );
    heading.querySelector("h2").id = "haze-title";

    const stamp = view.airQuality?.timestamp
      ? t("haze.updated", { time: formatClock(view.airQuality.timestamp) })
      : "";
    const tools = el("div", "haze-hero__tools");
    tools.append(el("p", "haze-hero__stamp", stamp));
    const airgramButton = el("button", "button button--small haze-hero__card-button", t("airgram.open"));
    airgramButton.type = "button";
    airgramButton.addEventListener("click", () => onOpenAirgram?.());
    tools.append(airgramButton);
    head.append(heading, tools);
    element.append(head);

    if (!category) {
      const loading = view.airQualityStatus === "loading" || view.airQualityStatus === "idle";
      element.append(loading ? createSkeleton() : createRetry(view));
      return;
    }

    const display = getAqiDisplay(category);
    const advisory = getHealthAdvisory(aqi);
    const pm25 = view.airQuality?.pm25;
    const cigarettes = getCigaretteEquivalent(pm25);
    const locationName = getLocationDisplayName(view.location) || "—";

    const body = el("div", "haze-hero__body");

    const readout = el("div", "haze-hero__readout");
    const location = el("p", "haze-hero__location", locationName);
    const score = el("div", "haze-hero__score");
    score.append(el("p", "haze-hero__value", formatNumber(aqi)));
    const scoreMeta = el("div", "haze-hero__score-meta");
    scoreMeta.append(
      el("span", "haze-hero__aqi-label", t("haze.aqi")),
      el("span", "haze-hero__badge", display?.badge ?? "—")
    );
    score.append(scoreMeta);
    readout.append(location, score);

    const pmLine = el("p", "haze-hero__pm");
    pmLine.append(
      el("span", "haze-hero__pm-label", t("haze.pm25")),
      el("strong", "haze-hero__pm-value", formatNumber(pm25, 1)),
      el("span", "haze-hero__pm-unit", "µg/m³")
    );
    readout.append(pmLine, el("p", "haze-hero__scale", t("haze.scaleNote")));
    body.append(readout);

    const advisoryWrap = el("div", "haze-hero__advisory");

    const mask = el("div", `haze-mask haze-mask--${advisory?.maskLevel ?? "none"}`);
    mask.append(
      el("p", "haze-mask__label", t("haze.maskTitle")),
      el("p", "haze-mask__value", advisory ? t(advisory.maskKey) : "—")
    );
    advisoryWrap.append(mask);

    const facts = el("div", "haze-facts");
    facts.append(
      createFact(
        t("haze.activityTitle"),
        advisory ? t(advisory.activityKey) : "—",
        "haze-fact--wide"
      ),
      createFact(
        t("haze.sensitiveTitle"),
        advisory ? t(advisory.sensitiveKey) : "—",
        "haze-fact--wide"
      )
    );
    advisoryWrap.append(facts);

    const smoke = el("div", "haze-smoke");
    const smokeText = el("div", "haze-smoke__text");
    smokeText.append(
      el("p", "haze-smoke__label", t("haze.smokeTitle")),
      el("p", "haze-smoke__formula", t("haze.smokeFormula"))
    );
    const smokeValue = el("p", "haze-smoke__value");
    smokeValue.append(
      el(
        "strong",
        "haze-smoke__number",
        cigarettes === null ? "—" : formatNumber(cigarettes, 1)
      ),
      el("span", "haze-smoke__unit", cigarettes === null ? t("haze.smokeEmpty") : t("haze.smokeUnit"))
    );
    smoke.append(smokeValue, smokeText);
    advisoryWrap.append(smoke);

    body.append(advisoryWrap);
    element.append(body);
  }

  return { element, update };
}
