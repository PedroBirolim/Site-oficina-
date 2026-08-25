import { buildWhatsAppUrl, WHATSAPP_NUMBER } from "./config.js";

const STORAGE_KEY = "oficina-selecao-orcamento-v2";
const GROUP_LABELS = {
  accessories: { singular: "item", plural: "itens", heading: "Acessórios selecionados" },
  detailing: { singular: "serviço", plural: "serviços", heading: "Serviços selecionados" },
};

const state = {
  selections: { accessories: new Set(), detailing: new Set() },
  vehicle: { brand: "", model: "", year: "", color: "" },
};

let toastTimer;

export function initConfigurators() {
  loadSavedState();
  bindSelectionControls();
  bindSummaryActions();
  bindVehicleFields();
  bindCatalogFilters();
  restoreVehicleFields();
  renderAll();
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return;
    Object.keys(state.selections).forEach((group) => {
      if (Array.isArray(saved.selections?.[group])) state.selections[group] = new Set(saved.selections[group].filter(Boolean));
    });
    if (saved.vehicle && typeof saved.vehicle === "object") {
      Object.keys(state.vehicle).forEach((field) => { state.vehicle[field] = String(saved.vehicle[field] || ""); });
    }
  } catch {
    // Dados inválidos ou armazenamento indisponível não impedem o uso do configurador.
  }
}

function bindSelectionControls() {
  document.querySelectorAll("[data-select-item]").forEach((control) => {
    const eventName = control instanceof HTMLInputElement ? "change" : "click";
    control.addEventListener(eventName, () => {
      const group = control.dataset.group;
      const item = control.dataset.item;
      if (!state.selections[group] || !item) return;

      const shouldSelect = control instanceof HTMLInputElement ? control.checked : !state.selections[group].has(item);
      if (shouldSelect) state.selections[group].add(item);
      else state.selections[group].delete(item);
      renderGroup(group, true);
    });
  });
}

function bindSummaryActions() {
  document.querySelectorAll("[data-save-selection]").forEach((button) => {
    button.addEventListener("click", () => {
      if (saveState()) showToast("Seleção salva! Você pode continuar navegando.");
    });
  });

  document.querySelectorAll("[data-request-quote]").forEach((button) => {
    button.addEventListener("click", () => requestQuote(button.dataset.requestQuote));
  });

  document.querySelectorAll("[data-summary-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.summaryToggle;
      const panel = document.querySelector(`[data-summary-panel="${group}"]`);
      if (!panel) return;
      const open = !panel.classList.contains("mobile-open");

      if (open) {
        document.querySelectorAll("[data-summary-panel].mobile-open").forEach((otherPanel) => {
          otherPanel.classList.remove("mobile-open");
          const otherGroup = otherPanel.dataset.summaryPanel;
          const otherButton = document.querySelector(`[data-summary-toggle="${otherGroup}"]`);
          otherButton?.setAttribute("aria-expanded", "false");
          const otherText = otherButton && [...otherButton.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
          if (otherText) otherText.nodeValue = "Ver minha seleção ";
        });
      }

      panel.classList.toggle("mobile-open", open);
      document.body.classList.toggle("selection-drawer-open", open);
      button.setAttribute("aria-expanded", String(open));
      const textNode = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.nodeValue = open ? "Fechar seleção " : "Ver minha seleção ";
      if (open) window.setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    });
  });
}

function bindVehicleFields() {
  document.querySelectorAll("[data-vehicle-field]").forEach((input) => {
    input.addEventListener("input", () => {
      state.vehicle[input.name] = input.value.trim();
      document.querySelectorAll(`[data-vehicle-field][name="${input.name}"]`).forEach((other) => {
        if (other !== input) other.value = input.value;
      });
    });
  });
}

function restoreVehicleFields() {
  document.querySelectorAll("[data-vehicle-field]").forEach((input) => { input.value = state.vehicle[input.name] || ""; });
}

function bindCatalogFilters() {
  const toolbar = document.querySelector("[data-accessory-filters]");
  if (!toolbar) return;
  const cards = [...document.querySelectorAll("[data-accessory-catalog] [data-category]")];

  toolbar.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      toolbar.querySelectorAll("[data-filter]").forEach((other) => {
        const active = other === button;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      cards.forEach((card) => {
        const visible = filter === "all" || card.dataset.category === filter;
        card.hidden = !visible;
        if (visible) {
          card.classList.remove("filter-in");
          void card.offsetWidth;
          card.classList.add("filter-in");
        }
      });
    });
  });
}

function renderAll() {
  Object.keys(state.selections).forEach((group) => renderGroup(group, false));
}

function renderGroup(group, animate) {
  const selected = state.selections[group];
  if (!selected) return;

  document.querySelectorAll(`[data-select-item][data-group="${group}"]`).forEach((control) => {
    const isSelected = selected.has(control.dataset.item);
    if (control instanceof HTMLInputElement) {
      control.checked = isSelected;
      control.closest(".care-option")?.classList.toggle("is-selected", isSelected);
    } else {
      control.setAttribute("aria-pressed", String(isSelected));
      control.classList.toggle("is-selected", isSelected);
      control.closest(".accessory-card")?.classList.toggle("is-selected", isSelected);
      const label = control.querySelector("[data-action-label]");
      const check = control.querySelector(".select-check");
      if (label) label.textContent = isSelected ? "Selecionado" : "Tenho interesse";
      if (check) check.textContent = isSelected ? "✓" : "+";
    }
  });

  document.querySelectorAll(`[data-selected-list="${group}"]`).forEach((list) => renderSelectedList(list, group, selected));
  const label = GROUP_LABELS[group];
  const countText = `${selected.size} ${selected.size === 1 ? label.singular : label.plural}`;
  document.querySelectorAll(`[data-selection-count="${group}"]`).forEach((counter) => {
    counter.textContent = countText;
    if (animate) pulse(counter);
  });
  document.querySelectorAll(`[data-selection-badge="${group}"]`).forEach((badge) => {
    badge.textContent = String(selected.size);
    badge.classList.toggle("has-items", selected.size > 0);
    if (animate) pulse(badge);
  });
}

function renderSelectedList(list, group, selected) {
  list.replaceChildren();
  if (!selected.size) {
    const empty = document.createElement("p");
    empty.dataset.emptySelection = "";
    empty.textContent = group === "detailing" ? "Escolha os serviços para montar seu cuidado." : "Nenhum acessório selecionado.";
    list.append(empty);
    return;
  }

  selected.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Remover ${item}`);
    const label = document.createElement("span");
    label.textContent = `✓ ${item}`;
    const remove = document.createElement("i");
    remove.textContent = "×";
    remove.setAttribute("aria-hidden", "true");
    button.append(label, remove);
    button.addEventListener("click", () => {
      state.selections[group].delete(item);
      renderGroup(group, true);
    });
    list.append(button);
  });
}

function saveState() {
  const serializable = {
    selections: Object.fromEntries(Object.entries(state.selections).map(([group, items]) => [group, [...items]])),
    vehicle: state.vehicle,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    return true;
  } catch {
    showToast("Não foi possível salvar neste navegador, mas sua seleção continua ativa.", "warning");
    return false;
  }
}

function requestQuote(group) {
  const items = [...(state.selections[group] || [])];
  if (!items.length) {
    const itemLabel = group === "accessories" ? "acessório" : "serviço";
    showToast(`Selecione pelo menos um ${itemLabel} para solicitar seu orçamento.`, "warning");
    const firstControl = document.querySelector(`[data-select-item][data-group="${group}"]`);
    firstControl?.focus();
    return;
  }

  saveState();
  const message = buildQuoteMessage(group, items);
  const url = buildWhatsAppUrl(message);
  window.dispatchEvent(new CustomEvent("quote:generated", { detail: { group, items, vehicle: { ...state.vehicle }, message, url } }));
  if (!WHATSAPP_NUMBER) showToast("Número ainda não configurado. Abrindo o compartilhamento do WhatsApp.");
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildQuoteMessage(group, items) {
  const vehicleLines = [];
  const name = [state.vehicle.brand, state.vehicle.model].filter(Boolean).join(" ");
  if (name) vehicleLines.push(`Veículo: ${name}`);
  if (state.vehicle.year) vehicleLines.push(`Ano: ${state.vehicle.year}`);
  if (state.vehicle.color) vehicleLines.push(`Cor: ${state.vehicle.color}`);
  const vehicleBlock = vehicleLines.length ? `\n\n${vehicleLines.join("\n")}` : "";
  const selectionBlock = items.map((item) => `- ${item}`).join("\n");
  return `Olá! Gostaria de solicitar um orçamento para meu veículo.${vehicleBlock}\n\n${GROUP_LABELS[group].heading}:\n\n${selectionBlock}\n\nGostaria de saber o valor e a disponibilidade.`;
}

function pulse(element) {
  element.classList.remove("selection-pulse");
  void element.offsetWidth;
  element.classList.add("selection-pulse");
}

function showToast(message, tone = "success") {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}
