export function initAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -45px" },
    );

    reveals.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min((index % 4) * 70, 210)}ms`;
      revealObserver.observe(item);
    });
  }

  initCursor(reducedMotion);
  initHeroParallax(reducedMotion);
  initCounters(reducedMotion);
}

function initCounters(reducedMotion) {
  const counters = document.querySelectorAll("[data-counter]");
  const animate = (counter) => {
    const target = Number.parseInt(counter.dataset.counter, 10) || 0;
    const suffix = counter.dataset.suffix || "";
    const padding = counter.dataset.counter.length;
    if (reducedMotion || target === 0) {
      counter.textContent = `${String(target).padStart(padding, "0")}${suffix}`;
      return;
    }

    const startedAt = performance.now();
    const duration = 1300;
    const frame = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      counter.textContent = `${String(value).padStart(padding, "0")}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  counters.forEach((counter) => observer.observe(counter));
}

function initHeroParallax(reducedMotion) {
  const backdrop = document.querySelector(".hero-backdrop");
  if (!backdrop || reducedMotion || window.matchMedia("(max-width: 820px)").matches) return;

  let scheduled = false;
  const update = () => {
    const offset = Math.min(window.scrollY * 0.08, 55);
    backdrop.style.translate = `0 ${offset}px`;
    scheduled = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

function initCursor(reducedMotion) {
  if (reducedMotion || !window.matchMedia("(pointer: fine) and (min-width: 1000px)").matches) return;

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.transform = `translate(${mouseX - 2.5}px, ${mouseY - 2.5}px)`;
  });

  document.querySelectorAll("a, button, summary, input").forEach((item) => {
    item.addEventListener("mouseenter", () => ring.classList.add("hover"));
    item.addEventListener("mouseleave", () => ring.classList.remove("hover"));
  });

  const animate = () => {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    const size = ring.classList.contains("hover") ? 46 : 30;
    ring.style.transform = `translate(${ringX - size / 2}px, ${ringY - size / 2}px)`;
    requestAnimationFrame(animate);
  };
  animate();
}
