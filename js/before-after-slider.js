const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function initBeforeAfterSliders() {
  document.querySelectorAll("[data-before-after]").forEach(initSlider);
}

function initSlider(component) {
  const range = component.querySelector("[data-compare-range]");
  const afterImage = component.querySelector("[data-after-image]");
  const handle = component.querySelector("[data-compare-handle]");
  if (!(range instanceof HTMLInputElement) || !afterImage || !handle) return;

  let activePointer = null;
  let demoTimer = null;
  let hasInteracted = false;

  const stopDemo = () => {
    hasInteracted = true;
    component.classList.remove("compare-demo");
    component.classList.add("compare-interacted");
    if (demoTimer) window.clearTimeout(demoTimer);
    demoTimer = null;
  };

  const render = (value) => {
    const percentage = clamp(Number(value) || 0, 0, 100);
    range.value = String(Math.round(percentage));
    range.setAttribute("aria-valuenow", range.value);
    range.setAttribute("aria-valuetext", `${range.value}% da largura`);
    afterImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    handle.style.left = `${percentage}%`;
  };

  const renderPointerPosition = (clientX) => {
    const bounds = component.getBoundingClientRect();
    if (!bounds.width) return;
    const percentage = ((clientX - bounds.left) / bounds.width) * 100;
    render(percentage);
  };

  const finishDrag = (event) => {
    if (activePointer !== event.pointerId) return;
    if (component.hasPointerCapture(event.pointerId)) component.releasePointerCapture(event.pointerId);
    activePointer = null;
    component.classList.remove("is-dragging");
  };

  component.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopDemo();
    activePointer = event.pointerId;
    component.setPointerCapture(event.pointerId);
    component.classList.add("is-dragging");
    range.focus({ preventScroll: true });
    renderPointerPosition(event.clientX);
    if (event.pointerType !== "touch") event.preventDefault();
  });

  component.addEventListener("pointermove", (event) => {
    if (activePointer !== event.pointerId) return;
    renderPointerPosition(event.clientX);
    if (event.cancelable) event.preventDefault();
  });

  component.addEventListener("pointerup", finishDrag);
  component.addEventListener("pointercancel", finishDrag);
  component.addEventListener("lostpointercapture", () => {
    activePointer = null;
    component.classList.remove("is-dragging");
  });
  component.addEventListener("dragstart", (event) => event.preventDefault());

  range.addEventListener("keydown", stopDemo);
  range.addEventListener("input", () => {
    stopDemo();
    render(range.value);
  });

  render(50);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    if (hasInteracted) {
      observer.disconnect();
      return;
    }
    component.classList.add("compare-demo");
    observer.disconnect();
    demoTimer = window.setTimeout(() => {
      component.classList.remove("compare-demo");
      demoTimer = null;
    }, 2200);
  }, { threshold: 0.55 });

  observer.observe(component);
}
