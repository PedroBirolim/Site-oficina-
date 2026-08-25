import { siteConfig, COMPANY_NAME } from "./config.js";
import { initNavigation } from "./navigation.js";
import { initAnimations } from "./animations.js";
import { initSimulator } from "./simulator.js";
import { initConfigurators } from "./configurator.js";
import { initBeforeAfterSliders } from "./before-after-slider.js?v=20260811-direct1";

function bindConfig() {
  document.querySelectorAll("[data-config], [data-config-src]").forEach((element) => {
    const key = element.dataset.config || element.dataset.configSrc;
    const value = siteConfig[key];
    if (!value) return;

    if (element instanceof HTMLAnchorElement && key.endsWith("Link")) element.href = value;
    else if (element instanceof HTMLImageElement && element.hasAttribute("data-config-src")) element.src = value;
    else element.textContent = value;
  });

  document.title = `${COMPANY_NAME} | Mecânica, Acessórios e Estética`;

}

function initFaq() {
  const items = [...document.querySelectorAll(".faq-list details")];
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function dismissLoader() {
  const loader = document.querySelector(".page-loader");
  requestAnimationFrame(() => requestAnimationFrame(() => loader?.classList.add("is-hidden")));
}

function init() {
  bindConfig();
  initNavigation();
  initAnimations();
  initBeforeAfterSliders();
  initFaq();
  initConfigurators();
  initSimulator();
  dismissLoader();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
