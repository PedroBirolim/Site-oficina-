export function initNavigation() {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector(".main-nav");
  const toggle = document.querySelector(".menu-toggle");
  const backToTop = document.querySelector(".back-to-top");
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const closeMenu = () => {
    menu?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-open");
  };

  toggle?.addEventListener("click", () => {
    const willOpen = !menu.classList.contains("open");
    menu.classList.toggle("open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggle.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", willOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const updateScrollState = () => {
    const scrolled = window.scrollY > 40;
    header?.classList.toggle("scrolled", scrolled);
    backToTop?.classList.toggle("visible", window.scrollY > 650);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  if ("IntersectionObserver" in window) {
    const activeSectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${visible.target.id}`;
          link.classList.toggle("active", isActive);
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-25% 0px -60%", threshold: [0, 0.15, 0.45] },
    );

    sections.forEach((section) => activeSectionObserver.observe(section));
  }
}

