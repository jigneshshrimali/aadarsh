/* ==========================================================================
   AADARSH TECHNOLOGIES — SECTION 01: CINEMATIC HERO EXPERIENCE
   Vanilla ES2025 module. No framework. GSAP + Lenis (UMD, on window) +
   Three.js (ES module, via import map in index.html).
   ========================================================================== */

/* Note: THREE is a global here (classic UMD build loaded via <script> in index.html),
   not an ES module import — this keeps the whole page runnable via file:// (double-click),
   with no local server or bundler required. */

document.body.classList.add("js-enabled");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------------------- */
/* 1. LENIS — premium smooth scroll                                     */
/* -------------------------------------------------------------------- */
let lenis = null;
if (window.Lenis && !prefersReducedMotion) {
  lenis = new window.Lenis({
    duration: 1.15,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  if (window.gsap && window.ScrollTrigger) {
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }
}

/* -------------------------------------------------------------------- */
/* 2. GSAP setup                                                        */
/* -------------------------------------------------------------------- */
const gsap = window.gsap;
if (gsap) {
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
}

/* -------------------------------------------------------------------- */
/* 3. NAVIGATION — scroll morph + mobile toggle                         */
/* -------------------------------------------------------------------- */
const nav = document.querySelector("[data-nav]");
const navToggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (gsap && window.ScrollTrigger) {
  window.ScrollTrigger.create({
    start: 24,
    onUpdate: (self) => {
      nav.classList.toggle("is-scrolled", self.scroll() > 24);
    },
  });
} else {
  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  });
}

navToggle.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

mobileMenu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* -------------------------------------------------------------------- */
/* 4. MAGNETIC BUTTONS — subtle cursor-follow pull                      */
/* -------------------------------------------------------------------- */
if (!prefersReducedMotion && gsap) {
  document.querySelectorAll(".btn--magnetic").forEach((btn) => {
    const strength = 0.35;

    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      gsap.to(btn, { x, y, duration: 0.4, ease: "expo.out" });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* -------------------------------------------------------------------- */
/* 5. HERO ENTRANCE CHOREOGRAPHY                                        */
/* -------------------------------------------------------------------- */
function runHeroTimeline() {
  const headline = document.querySelector(".hero__headline");
  let lines = headline ? headline.querySelectorAll(".line") : [];

  if (!gsap) {
    document.querySelectorAll("[data-reveal]").forEach((el) => (el.style.opacity = 1));
    return;
  }

  if (prefersReducedMotion) {
    gsap.set("[data-reveal]", { opacity: 1, y: 0, filter: "blur(0px)", clearProps: "transform,filter" });
    return;
  }

  // Lines get a soft blur-to-focus treatment on top of the vertical reveal —
  // reads as a deliberate "pull into focus" rather than a generic slide-up.
  gsap.set(lines, { yPercent: 130, rotate: 3, filter: "blur(6px)" });
  gsap.set(
    ["[data-reveal='badge']", "[data-reveal='headline']", "[data-reveal='sub']", "[data-reveal='cta']", "[data-reveal='visual']"],
    { autoAlpha: 0, y: 22 }
  );
  gsap.set("[data-reveal='visual']", { y: 0, scale: 0.94 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  tl.to("[data-reveal='badge']", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.15)
    .to("[data-reveal='headline']", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.32)
    .to(lines, { yPercent: 0, rotate: 0, filter: "blur(0px)", duration: 1.15, stagger: 0.12, ease: "expo.out" }, 0.32)
    .to("[data-reveal='sub']", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.6")
    .to("[data-reveal='cta']", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.45")
    .to("[data-reveal='visual']", { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: "expo.out" }, 0.55);
}

runHeroTimeline();

// Hero visual is now pure CSS/SVG (build-window mockup) — no WebGL/Three.js needed.

/* -------------------------------------------------------------------- */
/* 6. SERVICES — immersive modules                                      */
/* -------------------------------------------------------------------- */

// Click-to-expand detail panel per module
document.querySelectorAll(".module__head").forEach((head) => {
  head.addEventListener("click", () => {
    const module = head.closest(".module");
    const isOpen = module.classList.toggle("is-open");
    head.setAttribute("aria-expanded", String(isOpen));
  });
});

// Cursor-tracked spotlight glow per module (desktop pointer only)
if (window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".module").forEach((module) => {
    module.addEventListener("pointermove", (e) => {
      const rect = module.getBoundingClientRect();
      module.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      module.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
}

// Scroll-triggered reveals for headings, modules and any [data-sr='stats'] band in view
if (gsap && window.ScrollTrigger && !prefersReducedMotion) {
  gsap.utils.toArray("[data-sr='up']").forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      }
    );
  });

  gsap.utils.toArray(".services__grid, .window-stack").forEach((grid) => {
    gsap.fromTo(
      grid.children,
      { autoAlpha: 0, y: 36 },
      {
        autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.09,
        scrollTrigger: { trigger: grid, start: "top 82%" },
      }
    );
  });

  document.querySelectorAll(".stat-bar").forEach((statBar) => {
    gsap.fromTo(
      statBar,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out",
        scrollTrigger: { trigger: statBar, start: "top 88%" },
      }
    );
    window.ScrollTrigger.create({
      trigger: statBar,
      start: "top 88%",
      once: true,
      onEnter: () => animateStatBarCounters(statBar),
    });
  });
} else {
  document.querySelectorAll("[data-sr], .stat-bar").forEach((el) => (el.style.opacity = 1));
  document.querySelectorAll(".stat-bar").forEach((statBar) => animateStatBarCounters(statBar));
}

function animateStatBarCounters(scope) {
  scope.querySelectorAll(".stat-bar__num[data-count]").forEach((el) => {
    if (el.dataset.static) return; // e.g. "24/7" stays static text
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";

    if (!gsap || prefersReducedMotion) {
      el.textContent = `${target.toFixed(decimals)}${suffix}`;
      return;
    }
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => (el.textContent = `${counter.value.toFixed(decimals)}${suffix}`),
    });
  });
}

/* -------------------------------------------------------------------- */
/* 6.5 SOLUTIONS — window-chrome bento                                  */
/* -------------------------------------------------------------------- */

document.querySelectorAll(".app-window[data-tilt]").forEach((win) => {
  win.style.setProperty("--tilt", `${win.dataset.tilt}deg`);
});

function animateMiniStats(scope) {
  scope.querySelectorAll(".mini-stat__num[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    if (!gsap || prefersReducedMotion) {
      el.textContent = `${target.toFixed(decimals)}${suffix}`;
      return;
    }
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.3,
      ease: "power2.out",
      onUpdate: () => (el.textContent = `${counter.value.toFixed(decimals)}${suffix}`),
    });
  });
}

function animateMiniChart(scope) {
  const bars = scope.querySelectorAll(".mini-chart__bars rect");
  const line = scope.querySelector(".mini-chart__line");
  if (bars.length && gsap && !prefersReducedMotion) {
    gsap.set(bars, { scaleY: 0 });
    gsap.to(bars, { scaleY: 1, duration: 0.7, stagger: 0.05, ease: "expo.out", delay: 0.15 });
  }
  if (line) {
    const length = line.getTotalLength();
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;
    if (gsap && !prefersReducedMotion) {
      gsap.to(line, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", delay: 0.25 });
    } else {
      line.style.strokeDashoffset = 0;
    }
  }
}

const windowStack = document.querySelector(".window-stack");
if (windowStack) {
  if (gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: windowStack,
      start: "top 85%",
      once: true,
      onEnter: () => {
        animateMiniStats(windowStack);
        animateMiniChart(windowStack);
      },
    });
  } else {
    animateMiniStats(windowStack);
    animateMiniChart(windowStack);
  }
}

/* -------------------------------------------------------------------- */
/* 7. WHY CHOOSE US — connected core visual reveal                      */
/* -------------------------------------------------------------------- */
const whyVisual = document.querySelector(".why__visual");
if (whyVisual) {
  if (window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: whyVisual,
      start: "top 80%",
      once: true,
      onEnter: () => whyVisual.classList.add("is-visible"),
    });
  } else {
    whyVisual.classList.add("is-visible");
  }
}

/* -------------------------------------------------------------------- */
/* 8. CONTACT FORM — mailto handoff (no backend on a static site)       */
/* -------------------------------------------------------------------- */
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const project = (data.get("project") || "").toString();
    const message = (data.get("message") || "").toString().trim();

    if (!name || !email || !message) {
      contactForm.reportValidity();
      return;
    }

    const subject = `New project inquiry — ${project}`;
    const body = `Name: ${name}\nEmail: ${email}\nProject Type: ${project}\n\n${message}`;
    const mailto = `mailto:sales@aadarshtechnologies.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}
