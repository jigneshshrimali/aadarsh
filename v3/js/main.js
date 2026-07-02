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
      gsap.to(btn, { x, y, duration: 0.4, ease: "power3.out" });
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
    animateStatBarCounters(".stat-bar--hero");
    return;
  }

  if (prefersReducedMotion) {
    gsap.set("[data-reveal]", { opacity: 1, y: 0, x: 0, clearProps: "transform" });
    animateStatBarCounters(".stat-bar--hero");
    return;
  }

  gsap.set(lines, { yPercent: 130, rotate: 3 });
  gsap.set(
    [
      "[data-reveal='badge']",
      "[data-reveal='headline']",
      "[data-reveal='sub']",
      "[data-reveal='cta']",
      "[data-reveal='visual']",
      "[data-reveal='stat']",
    ],
    { autoAlpha: 0, y: 24 }
  );
  gsap.set("[data-reveal='visual']", { y: 0, scale: 0.92 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.to("[data-reveal='badge']", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.15)
    .to("[data-reveal='headline']", { autoAlpha: 1, y: 0, duration: 0.5 }, 0.3)
    .to(lines, { yPercent: 0, rotate: 0, duration: 1.05, stagger: 0.11, ease: "expo.out" }, 0.3)
    .to("[data-reveal='sub']", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.55")
    .to("[data-reveal='cta']", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.45")
    .to("[data-reveal='visual']", { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "expo.out" }, 0.5)
    .to("[data-reveal='stat']", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.7");

  // Hero stat-bar counts up as it enters, riding the same timeline
  tl.add(() => animateStatBarCounters(".stat-bar--hero"), "-=0.6");
}

runHeroTimeline();

class AISphere {
  constructor(canvas) {
    this.canvas = canvas;
    this.stage = canvas.parentElement;
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };
    this.clock = new THREE.Clock();

    this.initScene();
    this.buildSphere();
    this.buildRings();
    this.buildParticles();
    this.bindEvents();
    this.resize();

    if (!prefersReducedMotion) {
      this.tick();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 0, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  buildSphere() {
    // Lat/long wireframe globe — the clean "grid globe" look from the reference
    const geo = new THREE.SphereGeometry(1.7, 28, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4c97d6,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    this.core = new THREE.Mesh(geo, mat);
    this.group.add(this.core);

    // Soft blue glow behind the globe, billboard sprite using a radial-gradient canvas texture
    this.glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.makeGlowTexture(),
        color: 0x1c75bc,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.glow.scale.set(3.0, 3.0, 1);
    this.group.add(this.glow);
  }

  makeGlowTexture() {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.25)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  buildRings() {
    this.rings = [];
    // A single tilted blue orbit ring with a few riding satellite dots — matches the reference
    const ringDefs = [{ radius: 2.5, color: 0x4c97d6, tilt: [1.3, 0.15, 0], speed: 0.05, satCount: 3 }];

    ringDefs.forEach((def) => {
      const curve = new THREE.EllipseCurve(0, 0, def.radius, def.radius * 0.98, 0, Math.PI * 2);
      const points = curve.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: def.color, transparent: true, opacity: 0.45 });
      const ring = new THREE.LineLoop(geo, mat);
      ring.rotation.set(...def.tilt);
      ring.userData.speed = def.speed;
      ring.userData.satellites = [];
      this.group.add(ring);
      this.rings.push(ring);

      for (let i = 0; i < def.satCount; i++) {
        const satGeo = new THREE.SphereGeometry(0.036, 8, 8);
        const satMat = new THREE.MeshBasicMaterial({ color: 0x4c97d6 });
        const sat = new THREE.Mesh(satGeo, satMat);
        ring.add(sat);
        ring.userData.satellites.push({
          mesh: sat,
          radius: def.radius,
          offset: (Math.PI * 2 * i) / def.satCount,
        });
      }
    });
  }

  buildParticles() {
    // Sparse white star-dust — subtle depth cue, matches the reference's faint background specks
    const count = prefersReducedMotion ? 0 : 180;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.018,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    this.stage.addEventListener("pointermove", (e) => {
      const rect = this.stage.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      this.targetRotation.y = this.mouse.x * 0.35;
      this.targetRotation.x = this.mouse.y * -0.25;
    });

    this.stage.addEventListener("pointerleave", () => {
      this.targetRotation.x = 0;
      this.targetRotation.y = 0;
    });
  }

  resize() {
    const rect = this.stage.getBoundingClientRect();
    const size = Math.max(rect.width, 1);
    this.renderer.setSize(size, size, false);
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
  }

  tick() {
    const elapsed = this.clock.getElapsedTime();

    this.core.rotation.y = elapsed * 0.08;
    this.core.rotation.x = elapsed * 0.04;

    this.rings.forEach((ring) => {
      ring.rotation.z += ring.userData.speed * 0.016;
      ring.userData.satellites.forEach((sat) => {
        const t = elapsed * 0.4 + sat.offset;
        sat.mesh.position.set(Math.cos(t) * sat.radius, Math.sin(t) * sat.radius, 0);
      });
    });

    if (this.particles) this.particles.rotation.y = elapsed * 0.025;

    // Smooth parallax toward pointer
    this.group.rotation.y += (this.targetRotation.y - this.group.rotation.y) * 0.05;
    this.group.rotation.x += (this.targetRotation.x - this.group.rotation.x) * 0.05;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.tick());
  }
}

/* -------------------------------------------------------------------- */
/* 7. SERVICES — immersive modules                                      */
/* -------------------------------------------------------------------- */

// Fill each module's outcome ribbon from its data-outcome attribute
document.querySelectorAll(".module[data-outcome]").forEach((module) => {
  const outcome = module.querySelector(".module__outcome");
  if (outcome) outcome.textContent = module.dataset.outcome;
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

// Scroll-triggered reveals for headings, modules and the stat bar
if (gsap && window.ScrollTrigger && !prefersReducedMotion) {
  gsap.utils.toArray("[data-sr='up']").forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      }
    );
  });

  gsap.fromTo(
    "[data-sr='module']",
    { autoAlpha: 0, y: 36 },
    {
      autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.09,
      scrollTrigger: { trigger: ".services__grid", start: "top 82%" },
    }
  );

  const statBar = document.querySelector("[data-sr='stats']");
  if (statBar) {
    gsap.fromTo(
      statBar,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: statBar, start: "top 88%" },
      }
    );

    window.ScrollTrigger.create({
      trigger: statBar,
      start: "top 88%",
      once: true,
      onEnter: () => animateStatBarCounters("[data-sr='stats']"),
    });
  }
} else {
  document.querySelectorAll("[data-sr]").forEach((el) => (el.style.opacity = 1));
  animateStatBarCounters("[data-sr='stats']");
}

function animateStatBarCounters(scopeSelector) {
  const scope = scopeSelector ? document.querySelector(scopeSelector) : document;
  if (!scope) return;
  scope.querySelectorAll(".stat-bar__num[data-count]").forEach((el) => {
    if (el.dataset.static) return; // "24/7" stays static text
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const counter = { value: 0 };

    if (!gsap || prefersReducedMotion) {
      el.textContent = `${target.toFixed(decimals)}${suffix}`;
      return;
    }

    gsap.to(counter, {
      value: target,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => (el.textContent = `${counter.value.toFixed(decimals)}${suffix}`),
    });
  });
}

/* -------------------------------------------------------------------- */
/* 8. THREE.JS — AI ORBITAL SPHERE (hero centerpiece)                   */
/* -------------------------------------------------------------------- */
const sphereCanvas = document.getElementById("sphereCanvas");
if (sphereCanvas && window.WebGLRenderingContext) {
  try {
    new AISphere(sphereCanvas);
  } catch (err) {
    // Graceful degrade: hide canvas, keep the static mark + glow via CSS if WebGL fails
    console.warn("AISphere failed to initialize:", err);
    sphereCanvas.style.display = "none";
  }
}
