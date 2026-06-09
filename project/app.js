/* ============================================================
   Kevin Torres — Portafolio · interacción
   GSAP ScrollTrigger + Matter.js + canvas ambient
   ============================================================ */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* =========================================================
     1 · CUSTOM CURSOR
     ========================================================= */
  function initCursor() {
    if (!finePointer) return;
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;

    const setDot = gsap.quickSetter(dot, "css");
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      setDot({ x: mx, y: my });
    }, { passive: true });

    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    });

    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("[data-cursor], a, button")) ring.classList.add("is-active");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-cursor], a, button")) ring.classList.remove("is-active");
    });
  }

  /* =========================================================
     2 · NAV + SCROLL PROGRESS
     ========================================================= */
  function initChrome() {
    const nav = $("#nav");
    ScrollTrigger.create({
      start: "top -60",
      end: 99999,
      onUpdate: (self) => nav.classList.toggle("scrolled", self.scroll() > 60),
    });
    gsap.to("#progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
    });

    // smooth anchor scroll
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        gsap.to(window, { duration: 1, scrollTo: t, ease: "power2.inOut" });
      });
    });
  }

  /* =========================================================
     3 · AMBIENT PARTICLE FIELD (canvas)
     ========================================================= */
  function initParticles() {
    const cv = $("#bg-canvas");
    const ctx = cv.getContext("2d");
    let w, h, dpr, parts = [], mx = -999, my = -999;

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * dpr;
      h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + "px";
      cv.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function build() {
      const area = innerWidth * innerHeight;
      const count = prefersReduced ? 0 : Math.min(90, Math.round(area / 16000));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.5 + 0.15,
      }));
    }
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    addEventListener("resize", resize);
    resize();

    function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        // mild mouse parallax-repel
        const dx = p.x - mx, dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (14000 - d2) / 14000 * 0.6;
          p.x += (dx) * 0.002 * f * 8;
          p.y += (dy) * 0.002 * f * 8;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = innerWidth + 10;
        if (p.x > innerWidth + 10) p.x = -10;
        if (p.y < -10) p.y = innerHeight + 10;
        if (p.y > innerHeight + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(34,211,238,${p.a})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    if (!prefersReduced) tick();
  }

  /* =========================================================
     4 · HERO — disassembly on scroll
     ========================================================= */
  function initHero() {
    // entrance is handled by CSS keyframes (see .hero-text / #avatarIntro in styles.css)
    // — kept off the GSAP scrub timeline so it can never revert to a hidden from-state.

    const frags = $$("[data-frag]");
    // assign scatter targets
    const targets = frags.map((f, i) => {
      const ang = (i / frags.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
      const reach = (Math.min(innerWidth, innerHeight)) * (0.34 + Math.random() * 0.3);
      return {
        x: Math.cos(ang) * reach,
        y: Math.sin(ang) * reach * 0.82,
        rot: (Math.random() - 0.5) * 90,
      };
    });

    const mm = gsap.matchMedia();

    // full disassembly — desktop / tablet
    mm.add("(min-width: 721px)", () => {
      const stage = $("#heroStage");
      const CODE = ["</>", "{ }", "const", "=>", "async", "λ", "0x1A", "npm i",
        "git push", "SELECT", "{...}", "#!", "01", "</div>", "AWS", "π", "Σ", "()"];
      let regenLock = false;

      // rebuild the avatar from converging code fragments
      function materializeAvatar() {
        gsap.fromTo("#avatar", { scale: 0.84, filter: "blur(5px)" },
          { scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.75, ease: "back.out(1.7)", overwrite: false });
        gsap.fromTo("#scan", { yPercent: -120, opacity: 0 },
          { yPercent: 640, opacity: 1, duration: 0.6, ease: "none", onComplete: () => gsap.set("#scan", { opacity: 0 }) });
        gsap.fromTo("#photoDuo", { opacity: 0.8 }, { opacity: 0, duration: 0.55, ease: "power2.out" });

        const n = 18;
        for (let i = 0; i < n; i++) {
          const el = document.createElement("div");
          el.className = "frag-spawn";
          el.textContent = CODE[i % CODE.length];
          stage.appendChild(el);
          const ang = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
          const reach = Math.min(innerWidth, innerHeight) * (0.3 + Math.random() * 0.3);
          gsap.fromTo(el,
            { x: Math.cos(ang) * reach, y: Math.sin(ang) * reach * 0.82, opacity: 0, scale: 1.15, rotation: (Math.random() - 0.5) * 70 },
            {
              keyframes: { opacity: [0, 1, 1, 0] },
              x: 0, y: 0, scale: 0.25, rotation: 0,
              duration: 0.6 + Math.random() * 0.3,
              delay: Math.random() * 0.14,
              ease: "power2.in",
              onComplete: () => el.remove(),
            });
        }
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "+=135%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            // scrolling back up to the top → regenerate the avatar from code
            if (self.direction === -1 && self.progress < 0.05 && !regenLock) {
              regenLock = true;
              materializeAvatar();
            }
            if (self.progress > 0.35) regenLock = false; // re-arm after going down again
          },
        },
      });

      frags.forEach((f, i) => {
        const t = targets[i];
        tl.fromTo(f,
          { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: 0 },
          { x: t.x, y: t.y, scale: 1, opacity: 1, rotation: t.rot, ease: "power2.out", duration: 0.5 }, 0);
        tl.to(f,
          { x: t.x * 1.5, y: t.y * 1.5, scale: 1.05, opacity: 0, ease: "power1.in", duration: 0.5 }, 0.5);
      });

      // scan + duotone flash
      tl.fromTo("#scan", { yPercent: -120, opacity: 0 },
        { yPercent: 640, opacity: 1, duration: 0.45, ease: "none" }, 0.04);
      tl.to("#photoDuo", { opacity: 0.85, duration: 0.18 }, 0.06)
        .to("#photoDuo", { opacity: 0, duration: 0.22 }, 0.32);

      // center collapses
      tl.fromTo("#heroText",
        { opacity: 1, y: 0 },
        { opacity: 0, y: -26, duration: 0.4, immediateRender: false }, 0.18);
      tl.fromTo("#avatar",
        { scale: 1, opacity: 1, filter: "blur(0px)" },
        { scale: 0.5, opacity: 0, filter: "blur(6px)", duration: 0.5, ease: "power1.in", immediateRender: false }, 0.45);
      tl.to("#scrollHint", { opacity: 0, duration: 0.15 }, 0);

      return () => { /* matchMedia auto-reverts */ };
    });

    // mobile — simple fade
    mm.add("(max-width: 720px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
      });
      tl.to(".hero-center", { opacity: 0, y: -40, scale: 0.92, ease: "none" });
      tl.to("#scrollHint", { opacity: 0, duration: 0.2 }, 0);
    });
  }

  /* =========================================================
     5 · ABOUT — reveals + terminal typing
     ========================================================= */
  function initAbout() {
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.from(el, {
        y: 30, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    const lines = [
      { p: "$", t: "whoami" },
      { o: "Kevin Torres Pérez — Senior Full Stack Engineer" },
      { p: "$", t: "cat stack.json" },
      { o: '{ "cloud": "AWS Serverless", "arch": "Microservicios + DDD" }' },
      { o: '{ "db": ["PostgreSQL", "MongoDB", "DynamoDB"] }' },
      { p: "$", t: "git log --oneline -3" },
      { o: "feat: plataformas SaaS en producción  🚀" },
      { o: "refactor: legacy → arquitectura cloud moderna" },
      { o: "perf: serverless escalable, costo optimizado" },
      { p: "$", t: "./disponibilidad.sh" },
      { o: "> Abierto a nuevos retos de alto impacto ✦", hi: true },
    ];

    const body = $("#termBody");
    let started = false;

    function run() {
      if (started) return; started = true;
      let li = 0;
      function nextLine() {
        if (li >= lines.length) {
          const c = document.createElement("span");
          c.className = "term-cursor";
          body.appendChild(c);
          return;
        }
        const data = lines[li++];
        const lineEl = document.createElement("div");
        lineEl.className = "term-line";
        body.appendChild(lineEl);
        const prefix = data.p ? `<span class="prompt">${data.p} </span>` : "";
        const full = data.p ? data.t : data.o;
        const cls = data.p ? "" : (data.hi ? "val" : "out");
        let ci = 0;
        lineEl.innerHTML = prefix + `<span class="${cls}"></span>`;
        const span = lineEl.lastChild;
        const speed = data.p ? 32 : 12;
        (function typeChar() {
          span.textContent = full.slice(0, ci++);
          if (ci <= full.length) {
            setTimeout(typeChar, speed + Math.random() * 22);
          } else {
            setTimeout(nextLine, data.p ? 220 : 90);
          }
        })();
      }
      nextLine();
    }

    if (prefersReduced) {
      body.innerHTML = lines.map((d) =>
        d.p ? `<div class="term-line"><span class="prompt">${d.p} </span>${d.t}</div>`
            : `<div class="term-line"><span class="${d.hi ? "val" : "out"}">${d.o}</span></div>`
      ).join("");
    } else {
      ScrollTrigger.create({ trigger: "#terminal", start: "top 75%", once: true, onEnter: run });
    }
  }

  /* =========================================================
     6 · PROJECTS — pinned horizontal scroll
     ========================================================= */
  function initProjects() {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 721px)", () => {
      const track = $("#hTrack");
      const vp = $("#hViewport");
      const amount = () => Math.max(0, track.scrollWidth - vp.clientWidth);

      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: vp,
          start: "top top",
          end: () => "+=" + amount(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // subtle depth parallax on the visual mock as cards pass through
      $$(".proj-card").forEach((card) => {
        const mock = card.querySelector(".mock");
        if (!mock) return;
        gsap.fromTo(mock, { xPercent: -4 }, {
          xPercent: 4, ease: "none",
          scrollTrigger: {
            trigger: card, containerAnimation: tween,
            start: "left right", end: "right left", scrub: true,
          },
        });
      });
      return () => {};
    });
  }

  /* =========================================================
     7 · SKILLS — Matter.js gravity playground
     ========================================================= */
  const TECH = [
    { n: "TypeScript", c: 1 }, { n: "Next.js", c: 1 }, { n: "Node.js", c: 1 },
    { n: "React", c: 1 }, { n: "AWS", c: 1 }, { n: "PostgreSQL", c: 1 },
    { n: "Java", c: 1 },
    { n: "JavaScript" }, { n: "Spring Boot" }, { n: "Express" },
    { n: "Lambda" }, { n: "API Gateway" }, { n: "DynamoDB" }, { n: "Step Functions" },
    { n: "SQL Server" }, { n: "MongoDB" }, { n: "Supabase" }, { n: "Vercel" },
    { n: "Docker" }, { n: "Redis" }, { n: "Stripe" }, { n: "Swagger" },
    { n: "Git" }, { n: "Scrum" },
  ];

  function buildMobileGrid() {
    const grid = $("#skillsGrid");
    grid.innerHTML = TECH.map((t) =>
      `<span class="tech ${t.c ? "core" : ""}"><span class="led"></span>${t.n}</span>`
    ).join("");
  }

  function initPhysics() {
    if (!window.Matter) return;
    if (window.matchMedia("(max-width: 720px)").matches || prefersReduced) return;

    const stage = $("#physics");
    const { Engine, Composite, Bodies, Body, Mouse, MouseConstraint, Runner, Events } = Matter;

    let W = stage.clientWidth, H = stage.clientHeight;
    const engine = Engine.create();
    engine.world.gravity.y = 1;
    engine.world.gravity.scale = 0.0011;

    const items = [];
    const WALL = 200;

    function makeWalls() {
      return [
        Bodies.rectangle(W / 2, H + WALL / 2, W + WALL * 2, WALL, { isStatic: true }), // floor
        Bodies.rectangle(-WALL / 2, H / 2, WALL, H * 3, { isStatic: true }),            // left
        Bodies.rectangle(W + WALL / 2, H / 2, WALL, H * 3, { isStatic: true }),         // right
        Bodies.rectangle(W / 2, -H, W + WALL * 2, WALL, { isStatic: true }),            // ceiling (high)
      ];
    }
    let walls = makeWalls();
    Composite.add(engine.world, walls);

    // create DOM chips + bodies
    TECH.forEach((t, i) => {
      const el = document.createElement("div");
      el.className = "tech" + (t.c ? " core" : "");
      el.innerHTML = `<span class="led"></span>${t.n}`;
      stage.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = 60 + Math.random() * (W - 120);
      const y = -100 - Math.random() * 600; // drop from above, staggered
      const body = Bodies.rectangle(x, y, w, h, {
        chamfer: { radius: h / 2 },
        restitution: 0.42,
        friction: 0.05,
        frictionAir: 0.012,
        density: 0.0014,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
      items.push({ el, body, w, h });
      Composite.add(engine.world, body);
    });

    // mouse drag + repel
    const mouse = Mouse.create(stage);
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.18, render: { visible: false } },
    });
    Composite.add(engine.world, mc);
    // let page scroll keep working over the canvas
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

    let mPos = null;
    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      mPos = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    stage.addEventListener("mouseleave", () => { mPos = null; });

    Events.on(engine, "beforeUpdate", () => {
      if (!mPos) return;
      const R = 130;
      for (const it of items) {
        if (mc.body === it.body) continue;
        const dx = it.body.position.x - mPos.x;
        const dy = it.body.position.y - mPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < R && dist > 0.1) {
          const f = (1 - dist / R) * 0.016;
          Body.applyForce(it.body, it.body.position, {
            x: (dx / dist) * f,
            y: (dy / dist) * f,
          });
        }
      }
    });

    // sync DOM to bodies
    Events.on(engine, "afterUpdate", () => {
      for (const it of items) {
        const { x, y } = it.body.position;
        it.el.style.transform =
          `translate(${x - it.w / 2}px, ${y - it.h / 2}px) rotate(${it.body.angle}rad)`;
      }
    });

    const runner = Runner.create();
    let running = false;
    function start() { if (!running) { running = true; Runner.run(runner, engine); } }
    function stop() { if (running) { running = false; Runner.stop(runner); } }

    ScrollTrigger.create({
      trigger: "#skills",
      start: "top 60%",
      end: "bottom top",
      onEnter: start,
      onEnterBack: start,
      onLeave: stop,
      onLeaveBack: stop,
    });

    // resize → rebuild walls + clamp bodies in
    let rt;
    addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (window.matchMedia("(max-width: 720px)").matches) return;
        W = stage.clientWidth; H = stage.clientHeight;
        Composite.remove(engine.world, walls);
        walls = makeWalls();
        Composite.add(engine.world, walls);
        items.forEach((it) => {
          if (it.body.position.x > W - 20) Body.setPosition(it.body, { x: W - 60, y: it.body.position.y });
        });
        ScrollTrigger.refresh();
      }, 250);
    });
  }

  /* =========================================================
     8 · MAGNETIC BUTTONS
     ========================================================= */
  function initMagnetic() {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((wrap) => {
      const strength = 0.4;
      wrap.addEventListener("mousemove", (e) => {
        const r = wrap.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(wrap, { x: x * strength, y: y * strength, duration: 0.5, ease: "power3.out" });
      });
      wrap.addEventListener("mouseleave", () => {
        gsap.to(wrap, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    initCursor();
    initChrome();
    initParticles();
    initHero();
    initAbout();
    initProjects();
    buildMobileGrid();
    initPhysics();
    initMagnetic();
    ScrollTrigger.refresh();

    // guarantee hero content is revealed after the entrance window,
    // even if CSS entrance animations were throttled while backgrounded
    setTimeout(() => document.documentElement.classList.add("entrance-ready"), 2200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
