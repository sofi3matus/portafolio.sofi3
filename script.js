/* =========================================================
   sof.me — interacciones
   1. Cursor espada (sólo con mouse; en celular no)
   2. Arte braille que se transforma al pasar el mouse / tocar
   3. Franjas animadas al pie de cada página
   4. Placeholders para imágenes/videos que falten
   ========================================================= */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 0. SIN VIUDAS NI HUÉRFANAS ---------- */
  // La última palabra de cada párrafo va unida a la anterior con un espacio que no se corta,
  // así nunca queda una palabra sola en la última línea (en ninguna pantalla).
  document.querySelectorAll("p, figcaption").forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null, n;
    while ((n = walker.nextNode())) if (n.data.trim()) last = n;
    if (!last) return;
    const t = last.data.replace(/\s+$/, "");
    const i = t.lastIndexOf(" ");
    if (i > 0 && t.length - i < 22) last.data = t.slice(0, i) + "\u00A0" + t.slice(i + 1);
  });

  /* ---------- 1. CURSOR ESPADA ---------- */
  // Inspirada en el cursor de Radelica: una imagen que gira según la dirección del
  // movimiento, con peso. Encima: brillo metálico en los links y estela braille.
  const sword = document.querySelector(".sword");

  if (sword && finePointer) {
    document.documentElement.classList.add("has-sword");

    // hoja = imagen + brillo
    const img = sword.querySelector("img");
    const blade = document.createElement("div");
    blade.className = "sword__blade";
    const shine = img.cloneNode();
    shine.className = "sword__shine";
    shine.setAttribute("aria-hidden", "true");
    img.replaceWith(blade);
    blade.append(img, shine);

    const BASE = 135;                  // punta arriba-izquierda, empuñadura abajo-derecha
    const TRAIL = "⠁⠂⠄⡀⠈⠐⠠⢀";
    let mx = -100, my = -100;          // mouse
    let x = mx, y = my;                // espada (va un poquito detrás: tiene peso)
    let tilt = 0, tiltVel = 0, swing = 0, scale = 1;
    let hovering = false, lastTrail = 0, trailCount = 0;

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      sword.style.opacity = "";
      const now = performance.now();
      const speed = Math.hypot(e.movementX, e.movementY);
      if (!reduceMotion && speed > 6 && now - lastTrail > 38 && trailCount < 16) {
        lastTrail = now;
        const t = document.createElement("span");
        t.className = "sword-trail";
        t.textContent = TRAIL[(Math.random() * TRAIL.length) | 0];
        t.style.left = mx + (Math.random() * 8 - 4) + "px";
        t.style.top = my + (Math.random() * 8 - 4) + "px";
        document.body.appendChild(t);
        trailCount++;
        t.addEventListener("animationend", () => { t.remove(); trailCount--; });
      }
    });
    document.addEventListener("pointerleave", () => { sword.style.opacity = "0"; });
    document.addEventListener("pointerover", (e) => {
      hovering = !!e.target.closest("a, button, .braille");
      sword.classList.toggle("is-hover", hovering);
    });
    window.addEventListener("pointerdown", (e) => {
      swing = -60;                                   // ¡tajo!
      if (!reduceMotion) sparkle(e.clientX, e.clientY, 7);
    });

    let lastX = x;
    const tick = () => {
      // la espada sigue al mouse con un leve arrastre (la punta llega casi exacta)
      x += (mx - x) * 0.55;
      y += (my - y) * 0.55;
      const dx = x - lastX; lastX = x;
      // se inclina hacia donde vas, como un péndulo con resorte
      const target = Math.max(-38, Math.min(38, dx * 1.8)) + (hovering ? -14 : 0);
      tiltVel += (target - tilt) * 0.1;
      tiltVel *= 0.8;
      tilt += tiltVel;
      swing *= 0.84;
      scale += ((hovering ? 1.18 : 1) - scale) * 0.2;
      sword.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      blade.style.transform = `rotate(${BASE + tilt + swing}deg) scale(${scale})`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // estrellitas tipo ascii (como la ⭒ de "sof.me ⭒ concepto visual")
  const GLYPHS = ["⭒", "⭒", "⭒", "⭑", "✧", "⋆", "˚", "⊹"];
  function sparkle(px, py, count) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * (count > 1 ? 50 : 18);
      s.style.left = px + "px";
      s.style.top = py + "px";
      s.style.fontSize = 12 + Math.random() * 12 + "px";
      s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      s.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      s.style.setProperty("--rot", (Math.random() * 360 - 180) + "deg");
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
  }

  /* ---------- 2. ARTE BRAILLE ---------- */
  // Dibujo inicial (A) y en lo que se convierte (B)
  const ART_A = [
    "⠀⠀⢸⡿⢦⣄⠀⢀⣠⣴⣶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠘⣷⠀⠉⠛⠛⠉⢰⡇⠀⠀⠘⣷⣦⣾⡇⠀⠀⠀⠀⠀⠀⠀",
    "⠀⢀⣰⠿⠀⠀⠀⠀⠀⢿⡁⠀⢀⣴⣿⣿⣿⣶⡄⠀⠀⠀⠀⠀⠀",
    "⣴⣿⣁⡀⠀⠀⠀⠀⠀⠀⠻⣦⡀⠀⠀⢿⠃⠀⢀⣤⡀⠀⠀⠀⠀",
    "⠀⠈⠉⠛⣿⡀⠀⣰⠟⠛⠛⠛⠛⠀⠀⠀⠀⣠⡾⢻⡇⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠈⣷⣼⠏⠀⠀⠀⢻⣟⠻⠿⢶⡾⠋⠀⢸⡇⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠘⠃⠀⣴⠀⠀⠈⢻⣆⠀⠀⠀⠀⠀⠀⠻⢶⣤⣀⠀",
    "⠀⠀⠀⠀⠀⠘⢷⣾⣿⣤⣄⠀⢈⣿⠀⠀⠀⠀⠀⠀⠀⢀⣉⣿⠿",
    "⠀⠀⠀⠀⠀⢀⣾⠿⣿⡏⠉⢠⣾⠃⠀⠀⠀⠀⠀⢀⣾⠛⠋⠁⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠙⠃⠀⣿⡷⠿⠟⠛⢿⣦⡀⢸⡇⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⠃⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀",
  ];
  const ART_B = [
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⢀⡤⠒⠢⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣶⣀⡤⠀⠀⠀⠀",
    "⠀⢀⠏⠀⠀⠀⢀⡇⠀⠀⠀⠀⠠⠀⠀⠀⠀⠉⠙⡇⠀⠀⠀⠀⠀",
    "⠀⠸⡀⠀⠀⠒⠁⠀⠀⠀⠀⣠⢯⠄⠀⠀⠀⠀⠀⠀⠨⠀⠀⠀⠀",
    "⠀⠀⢣⡀⠀⠀⠀⠀⠀⠄⡜⢽⣿⣾⡵⠤⠆⠐⢀⠀⠈⡆⠀⠀⠀",
    "⠀⠀⠀⠀⠑⠒⠒⠒⠀⠀⠀⠀⢯⠆⠀⠀⠀⠀⠀⠀⠀⡃⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⢀⠀⢂⠀⡜⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣢⠶⣟⠓⠦⠂⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠀⣀⡴⠒⠘⠉⠉⠁⠀⠀⠀⠀⠇⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⡎⠀⢠⠖⠤⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠸⡄⠀⠈⠣⠂⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
    "⠀⠀⠀⠀⠀⠀⠈⠒⠢⠤⠤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
  ];
  const toGrid = (rows) => rows.map((r) => [...r]);
  const GRID_A = toGrid(ART_A), GRID_B = toGrid(ART_B);
  const NOISE = "⠁⠂⠄⠈⠐⠠⡀⢀⠃⠅⠘⠰⡄⢠⠿⣿⣤⠶";

  document.querySelectorAll(".braille").forEach((el) => {
    let current = GRID_A.map((r) => r.slice());
    let showingB = false;
    let raf = 0;
    const render = () => { el.textContent = current.map((r) => r.join("")).join("\n"); };
    render();

    // transformación "chispeante": cada caracter cambia en un momento aleatorio
    const morphTo = (target) => {
      cancelAnimationFrame(raf);
      if (reduceMotion) { current = target.map((r) => r.slice()); render(); return; }
      const start = performance.now();
      const DUR = 650;
      const delays = target.map((r) => r.map(() => Math.random() * DUR * 0.7));
      const step = (now) => {
        const t = now - start;
        let done = true;
        target.forEach((row, i) => row.forEach((ch, j) => {
          if (t >= delays[i][j] + 120) current[i][j] = ch;
          else if (t >= delays[i][j]) { current[i][j] = NOISE[(Math.random() * NOISE.length) | 0]; done = false; }
          else done = false;
        }));
        render();
        if (!done) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const show = (b) => { if (b === showingB) return; showingB = b; morphTo(b ? GRID_B : GRID_A); };
    if (finePointer) {
      el.addEventListener("pointerenter", () => show(true));
      el.addEventListener("pointerleave", () => show(false));
    } else {
      el.addEventListener("click", () => show(!showingB));   // en celular: tocar
    }
  });

  /* ---------- 2b. BOTÓN VOLVER (estrella braille) ---------- */
  // Al pasar el mouse la estrella se deshace en puntitos sueltos y se vuelve a armar.
  const LOOSE = "⠁⠂⠄⠈⠐⠠⡀⢀⠃⠘⠆⠰";
  document.querySelectorAll(".back-star").forEach((btn) => {
    const art = btn.querySelector(".back-star__art");
    const grid = art.textContent.split("\n").map((r) => [...r]);
    let raf = 0;
    const render = (g) => { art.textContent = g.map((r) => r.join("")).join("\n"); };

    const dissolve = (leaving = false) => {
      if (reduceMotion) return;
      cancelAnimationFrame(raf);
      const start = performance.now();
      const DUR = leaving ? 320 : 700;
      // cada caracter con tinta se desarma y se rearma en su propio momento
      const timing = grid.map((r) => r.map((ch) => ch === "⠀" ? null :
        { off: Math.random() * DUR * 0.35, back: DUR * 0.45 + Math.random() * DUR * 0.5 }));
      const step = (now) => {
        const t = now - start;
        let done = true;
        const frame = grid.map((r, i) => r.map((ch, j) => {
          const tm = timing[i][j];
          if (!tm) return ch;
          if (t < tm.off) { done = false; return ch; }
          if (leaving || t < tm.back) {
            done = leaving ? t >= DUR && done : false;
            return Math.random() < (leaving ? 0.35 : 0.5) ? "⠀" : LOOSE[(Math.random() * LOOSE.length) | 0];
          }
          return ch;
        }));
        render(frame);
        if (!done && t < DUR + 200) raf = requestAnimationFrame(step);
        else if (!leaving) render(grid);
      };
      raf = requestAnimationFrame(step);
    };
    btn.addEventListener("pointerenter", () => dissolve());
    btn.addEventListener("focus", () => dissolve());

    // click: la estrella se deshace del todo, suelta estrellitas y vuelve atrás
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const r = art.getBoundingClientRect();
      if (!reduceMotion) sparkle(r.left + r.width / 2, r.top + r.height / 2, 8);
      btn.classList.add("is-leaving");
      dissolve(true);
      const sameSite = document.referrer && new URL(document.referrer, location.href).origin === location.origin;
      setTimeout(() => {
        const go = () => {
          if (sameSite && history.length > 1) history.back();
          else location.href = btn.getAttribute("href");
        };
        if (window.__sofmeLeave) window.__sofmeLeave(go); else go();
      }, reduceMotion ? 0 : 200);
    });
    // al volver con el botón "atrás" del navegador, la estrella aparece entera
    window.addEventListener("pageshow", () => { btn.classList.remove("is-leaving"); render(grid); });
  });

  /* ---------- 3. FRANJAS ANIMADAS ---------- */
  document.querySelectorAll(".marquee__track").forEach((track) => {
    const text = track.dataset.text || "";
    // dos mitades iguales para que el loop sea continuo
    const half = Array.from({ length: 10 }, () => `<span>${text}</span>`).join("");
    track.innerHTML = half + half;
  });
  // velocidad constante en px por segundo (como sadti.xyz, ~60 px/s),
  // así no "acelera" en pantallas anchas ni con textos más largos
  const MARQUEE_SPEED = 60;
  const setMarqueeSpeed = () => {
    document.querySelectorAll(".marquee__track").forEach((track) => {
      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 0) track.style.animationDuration = (halfWidth / MARQUEE_SPEED).toFixed(2) + "s";
    });
  };
  setMarqueeSpeed();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setMarqueeSpeed);
  let mt;
  window.addEventListener("resize", () => { clearTimeout(mt); mt = setTimeout(setMarqueeSpeed, 200); });

  /* ---------- 4. PLACEHOLDERS ---------- */
  document.querySelectorAll("figure img, figure video").forEach((media) => {
    const fig = media.closest("figure");
    const mark = () => fig.classList.add("is-missing");
    if (media.tagName === "IMG") {
      if (media.complete && media.naturalWidth === 0) mark();
      else media.addEventListener("error", mark);
    } else {
      // con <source>: si fallan todas, el error llega en la última
      const sources = media.querySelectorAll("source");
      const last = sources[sources.length - 1];
      (last || media).addEventListener("error", mark);
      media.addEventListener("loadeddata", () => fig.classList.remove("is-missing"));
    }
  });

  // vistas previas de la portada: si todavía no exportas la imagen del UI kit,
  // usa una imagen parecida del proyecto
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const useFallback = () => { if (img.src.indexOf(img.dataset.fallback) === -1) img.src = img.dataset.fallback; };
    if (img.complete && img.naturalWidth === 0) useFallback();
    else img.addEventListener("error", useFallback, { once: true });
  });

  /* ---------- 4b. VISTA PREVIA FIJA AL CENTRO (portada) ---------- */
  const vista = document.querySelector(".hero__view");
  if (vista && finePointer) {
    const vImg = vista.querySelector("img"), vCap = vista.querySelector(".hero__cap");
    document.querySelectorAll(".hero__list a[data-preview]").forEach((a) => {
      new Image().src = a.dataset.preview;                      // precarga, así aparece al tiro
      a.addEventListener("pointerenter", () => {
        vImg.src = a.dataset.preview;
        vCap.textContent = `⭒ ${a.querySelector(".hero__name").textContent} ⭒`;
        vista.classList.add("is-on");
      });
      a.addEventListener("pointerleave", () => vista.classList.remove("is-on"));
    });
  }

  /* ---------- 5. PORTADAS QUE REBOTAN (between ends) ---------- */
  // Misma idea que en tu sitio: cada portada rebota en los bordes como el logo del DVD.
  const coverBox = document.querySelector(".be__covers");
  if (coverBox) {
    const covers = [...coverBox.querySelectorAll("img")];
    let items = [];
    const place = () => {
      const W = coverBox.clientWidth, H = coverBox.clientHeight;
      items = covers.map((el) => {
        const s = el.offsetWidth || 54;
        const ang = Math.random() * Math.PI * 2;
        const speed = 18 + Math.random() * 22;              // px por segundo: lento, tranquilo
        return { el, s, x: Math.random() * (W - s), y: Math.random() * (H - s),
                 vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed };
      });
      items.forEach((it) => { it.el.style.transform = `translate(${it.x}px, ${it.y}px)`; });
    };
    place();

    if (!reduceMotion) {
      let visible = false, last = 0, raf = 0;
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        const W = coverBox.clientWidth, H = coverBox.clientHeight;
        items.forEach((it) => {
          it.x += it.vx * dt;
          it.y += it.vy * dt;
          if (it.x <= 0 || it.x + it.s >= W) { it.vx *= -1; it.x = Math.max(0, Math.min(it.x, W - it.s)); }
          if (it.y <= 0 || it.y + it.s >= H) { it.vy *= -1; it.y = Math.max(0, Math.min(it.y, H - it.s)); }
          it.el.style.transform = `translate(${it.x}px, ${it.y}px)`;
        });
        if (visible) raf = requestAnimationFrame(tick);
      };
      // sólo se anima mientras está en pantalla
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) { last = performance.now(); raf = requestAnimationFrame(tick); }
      }).observe(coverBox);
    }
    // si cambia el tamaño de la ventana, se reparten de nuevo
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(place, 200); });
  }

  /* ---------- 6. TRANSICIÓN BRAILLE ENTRE PÁGINAS ---------- */
  // Al ir a otra página la pantalla se llena de puntitos braille; al llegar, se deshacen.
  const DOTS = "⠁⠂⠄⡀⠈⠐⠠⢀⠃⠘⠆⠰⠉⠒⠤⣀⠿⣿";
  const veil = document.createElement("pre");
  veil.className = "braille-veil";
  veil.setAttribute("aria-hidden", "true");
  document.body.appendChild(veil);

  const runVeil = (mode, dur, done) => {
    const cols = Math.ceil(innerWidth / 9) + 1, rows = Math.ceil(innerHeight / 15) + 1;
    const when = Float32Array.from({ length: cols * rows }, () => Math.random());
    veil.classList.add("is-on");
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - start) / dur);
      let out = "";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = when[r * cols + c];
          const shown = mode === "in" ? k < p : k >= p;
          out += shown ? DOTS[((k * 997 + r + c) | 0) % DOTS.length] : "⠀";
        }
        out += "\n";
      }
      veil.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else { if (mode === "out") veil.classList.remove("is-on"); if (done) done(); }
    };
    requestAnimationFrame(frame);
  };

  const KEY = "sofme-veil";
  let fromVeil = false;
  try { fromVeil = sessionStorage.getItem(KEY) === "1"; sessionStorage.removeItem(KEY); } catch (e) {}
  if (fromVeil && !reduceMotion) runVeil("out", 520);

  const leaveTo = (go) => {
    if (reduceMotion) return go();
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    runVeil("in", 340, go);
    setTimeout(() => veil.classList.remove("is-on"), 2500);   // por si la página no cambia
  };
  window.__sofmeLeave = leaveTo;   // lo usa el botón volver

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    const href = a.getAttribute("href");
    if (!/\.html(\?|#|$)/.test(href) || /^[a-z]+:/i.test(href)) return;   // sólo páginas de este sitio
    e.preventDefault();
    leaveTo(() => { location.href = href; });
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) { veil.classList.remove("is-on"); try { sessionStorage.removeItem(KEY); } catch (err) {} }
  });

  /* ---------- 8. FAMILIARIO: ARMA TU FAMILIA ---------- */
  // Figuras dibujadas en SVG como en el juego real (línea negra gruesa, cabeza + cuerpo),
  // "vestidas" con uno de los 18 patrones. El tablero muestra los huecos grises de la
  // familia convencional: lo que nadie llena queda vacío, igual que en el museo.
  const juego = document.querySelector(".fam-juego");
  if (juego) {
    // proporciones medidas de tus figuras de Figma (cabeza, grosor de línea, cuerpo)
    const CAB = [[60, 25, 24]];
    const FIGURAS = {
      papa:    { label: "papá",    head: CAB, body: "M2 76 H118 L60 174 Z" },
      mama:    { label: "mamá",    head: CAB, body: "M60 70 L118 172 H2 Z" },
      hijo:    { label: "hij@",    head: CAB, body: "M31 72 H89 L118 122 L89 172 H31 L2 122 Z" },
      abuelo:  { label: "abuelo",  head: CAB, body: "M6 72 H114 V172 H6 Z" },
      abuela:  { label: "abuela",  head: CAB, body: "M6 72 H114 V142 Q114 172 84 172 H36 Q6 172 6 142 Z" },
      persona: { label: "persona", head: CAB, body: "M60 172 C20 144 2 120 6 98 C10 74 44 68 60 93 C76 68 110 74 114 98 C118 120 100 144 60 172 Z" },
      mascota: { label: "mascota", head: [[30, 92, 13], [60, 76, 13], [90, 92, 13]], body: "M6 120 Q6 110 16 110 H104 Q114 110 114 120 V162 Q114 172 104 172 H16 Q6 172 6 162 Z" },
    };
    const NS = "http://www.w3.org/2000/svg";
    const nuevo = (tag, attrs) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
    // patron = número (relleno), null (blanco) o "hueco" (contorno gris, sin relleno)
    const figuraSVG = (tipo, patron) => {
      const f = FIGURAS[tipo];
      const hueco = patron === "hueco";
      const linea = hueco ? "#c4c4c4" : "#000";
      const grosor = hueco ? 4 : 5.5;
      const svg = nuevo("svg", { viewBox: "-4 -4 128 182", "aria-hidden": "true", "shape-rendering": "geometricPrecision" });
      svg.appendChild(nuevo("path", {
        d: f.body, fill: hueco ? "none" : patron ? `url(#pat-${patron})` : "#fff",
        stroke: linea, "stroke-width": grosor, "stroke-linejoin": "round",
      }));
      f.head.forEach(([cx, cy, r]) => svg.appendChild(nuevo("circle", {
        cx, cy, r, fill: hueco ? "none" : "#fff", stroke: linea, "stroke-width": grosor,
      })));
      return svg;
    };

    // las figuras son tus imágenes exportadas de Illustrator (img/figuras/tipo-patrón.png);
    // si falta alguna combinación, se dibuja en SVG con el patrón
    const FALTAN = new Set(["mascota-9"]);
    // tamaño real de cada imagen (px), para que todas queden a la misma escala dentro de la caja
    const TAM = { mama: [121, 177], papa: [123, 179], hijo: [121, 177], abuelo: [107, 177], abuela: [107, 177], persona: [118, 170], mascota: [134, 139] };
    const imagenFigura = (src, tipo) => {
      const img = document.createElement("img");
      const [w, h] = TAM[tipo];
      img.src = src; img.alt = ""; img.draggable = false;
      img.style.width = (w / 124.4) * 100 + "%";
      // la mascota se apoya abajo, como en el juego; el resto va centrada
      img.style.top = tipo === "mascota" ? 100 - (h / 177) * 100 + "%" : (100 - (h / 177) * 100) / 2 + "%";
      return img;
    };
    const figuraArte = (tipo, patron) =>
      FALTAN.has(`${tipo}-${patron}`) ? figuraSVG(tipo, patron) : imagenFigura(`img/figuras/${tipo}-${patron}.png`, tipo);

    const boxFiguras = juego.querySelector(".fam-juego__figuras");
    const boxPatrones = juego.querySelector(".fam-juego__patrones");
    const tablero = juego.querySelector(".fam-juego__tablero");
    let tipoSel = "hijo", patronSel = 1;

    Object.entries(FIGURAS).forEach(([tipo, f]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", tipo === tipoSel);
      b.dataset.tipo = tipo;
      const icono = tipo === "persona" ? figuraSVG(tipo, null) : Object.assign(document.createElement("img"), { src: `img/figuras/icono-${tipo}.png`, alt: "" });
      b.append(icono, document.createTextNode(f.label));
      boxFiguras.appendChild(b);
    });
    // mismo orden que la lámina: cada columna es un color
    const orden = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) orden.push(c * 3 + r + 1);
    for (const i of orden) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", i === patronSel);
      b.setAttribute("aria-label", `patrón ${i}`);
      b.dataset.patron = i;
      b.style.backgroundImage = `url(img/patrones/p${i}.png)`;
      boxPatrones.appendChild(b);
    }
    const marcar = (box, attr, val) => box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", b.dataset[attr] == val));
    boxFiguras.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; tipoSel = b.dataset.tipo; marcar(boxFiguras, "tipo", tipoSel); });
    boxPatrones.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; patronSel = +b.dataset.patron; marcar(boxPatrones, "patron", patronSel); });

    /* --- huecos: la familia convencional (mamá △, papá ▽ y dos hij@s) dibujada en gris --- */
    let huecos = [];
    const dibujarHuecos = () => {
      tablero.querySelectorAll(".fam-hueco").forEach((h) => h.remove());
      huecos = [];
      const W = tablero.clientWidth, H = tablero.clientHeight;
      const fw = parseFloat(getComputedStyle(tablero).getPropertyValue("--fig")) || 52;
      const fh = fw * 182 / 128;
      const slotW = fw * 2 + fw * 0.95, slotH = fh * 2 + fh * 0.35;
      const cols = Math.max(1, Math.floor(W / slotW)), rows = Math.max(1, Math.floor(H / slotH));
      const gapX = (W - cols * slotW) / cols, gapY = (H - rows * slotH) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x0 = gapX / 2 + c * (slotW + gapX) + slotW / 2;
        const y0 = gapY / 2 + r * (slotH + gapY) + slotH / 2;
        const dx = fw * 0.56, dy = fh * 0.54;
        [["mama", x0 - dx, y0 - dy], ["papa", x0 + dx, y0 - dy], ["hijo", x0 - dx, y0 + dy], ["hijo", x0 + dx, y0 + dy]]
          .forEach(([tipo, x, y]) => {
            const el = document.createElement("div");
            el.className = "fam-hueco";
            el.style.left = (x / W) * 100 + "%";
            el.style.top = (y / H) * 100 + "%";
            el.appendChild(figuraSVG(tipo, "hueco"));
            tablero.prepend(el);
            huecos.push({ tipo, x: (x / W) * 100, y: (y / H) * 100 });
          });
      }
    };

    /* --- figuras puestas (posición en %, así se adapta a cualquier pantalla) --- */
    const puestas = [];
    const ocupado = (h, salvo) => puestas.some((el) => el !== salvo && Math.abs(parseFloat(el.style.left) - h.x) < 0.5 && Math.abs(parseFloat(el.style.top) - h.y) < 0.5);
    // si la figura cae cerca de su hueco (mamá en mamá, etc.), se acomoda justo encima
    const acomodar = (el, tipo) => {
      const W = tablero.clientWidth, H = tablero.clientHeight;
      const fw = el.offsetWidth || 52;
      const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
      let mejor = null, dist = fw * 0.9;
      huecos.forEach((h) => {
        if (h.tipo !== tipo || ocupado(h, el)) return;
        const d = Math.hypot(((h.x - x) / 100) * W, ((h.y - y) / 100) * H);
        if (d < dist) { dist = d; mejor = h; }
      });
      if (mejor) { el.style.left = mejor.x + "%"; el.style.top = mejor.y + "%"; }
    };
    const poner = (tipo, patron, x, y, conBrillo = true) => {
      const el = document.createElement("div");
      el.className = "fam-fig";
      el.dataset.tipo = tipo;
      el.style.left = x + "%";
      el.style.top = y + "%";
      el.setAttribute("aria-label", `${FIGURAS[tipo].label} con patrón ${patron}`);
      el.appendChild(figuraArte(tipo, patron));
      tablero.appendChild(el);
      puestas.push(el);
      acomodar(el, tipo);
      if (conBrillo && !reduceMotion) {
        const r = el.getBoundingClientRect();
        sparkle(r.left + r.width / 2, r.top + r.height / 3, 5);
      }
      return el;
    };
    const porcentaje = (e) => {
      const r = tablero.getBoundingClientRect();
      return {
        x: Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100)),
        y: Math.min(92, Math.max(8, ((e.clientY - r.top) / r.height) * 100)),
      };
    };

    // tocar el tablero = poner figura; arrastrar una figura = moverla
    let arrastrando = null, movido = false;
    tablero.addEventListener("pointerdown", (e) => {
      const fig = e.target.closest(".fam-fig");
      if (!fig) return;
      arrastrando = fig; movido = false;
      fig.classList.add("is-dragging");
      tablero.setPointerCapture(e.pointerId);
      tablero.appendChild(fig);
      e.preventDefault();
    });
    tablero.addEventListener("pointermove", (e) => {
      if (!arrastrando) return;
      movido = true;
      const p = porcentaje(e);
      arrastrando.style.left = p.x + "%";
      arrastrando.style.top = p.y + "%";
    });
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando.classList.remove("is-dragging");
      acomodar(arrastrando, arrastrando.dataset.tipo);
      arrastrando = null;
    };
    tablero.addEventListener("pointerup", soltar);
    tablero.addEventListener("pointercancel", soltar);
    tablero.addEventListener("click", (e) => {
      if (e.target.closest(".fam-fig")) return;
      const p = porcentaje(e);
      poner(tipoSel, patronSel, p.x, p.y);
    });
    tablero.addEventListener("dblclick", (e) => {
      const fig = e.target.closest(".fam-fig");
      if (!fig || movido) return;
      fig.remove();
      puestas.splice(puestas.indexOf(fig), 1);
    });
    tablero.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); poner(tipoSel, patronSel, 40 + Math.random() * 20, 40 + Math.random() * 20); }
    });

    // acciones
    const azar = () => {
      const tipos = Object.keys(FIGURAS);
      const libres = huecos.filter((h) => !ocupado(h));
      const n = 2 + ((Math.random() * 4) | 0);
      for (let i = 0; i < n; i++) {
        const h = libres.length && Math.random() < 0.7 ? libres.splice((Math.random() * libres.length) | 0, 1)[0] : null;
        const tipo = h ? h.tipo : tipos[(Math.random() * tipos.length) | 0];
        const x = h ? h.x : 8 + Math.random() * 84, y = h ? h.y : 12 + Math.random() * 76;
        setTimeout(() => poner(tipo, 1 + ((Math.random() * 18) | 0), x, y, i === n - 1), i * 90);
      }
    };
    juego.querySelector(".fam-juego__acciones").addEventListener("click", (e) => {
      const accion = e.target.closest("button")?.dataset.accion;
      if (accion === "deshacer") { const el = puestas.pop(); if (el) el.remove(); }
      if (accion === "limpiar") { puestas.splice(0).forEach((el) => el.remove()); }
      if (accion === "azar") azar();
    });

    dibujarHuecos();
    // ejemplo de partida: una sola familia, el resto del tablero queda vacío para jugar
    const h = huecos;
    if (h.length >= 4) {
      poner("mama", 13, h[0].x, h[0].y, false);
      poner("papa", 4, h[1].x, h[1].y, false);
      poner("hijo", 1, h[2].x, h[2].y, false);
      poner("hijo", 7, h[3].x, h[3].y, false);
    }

    let rt2;
    window.addEventListener("resize", () => { clearTimeout(rt2); rt2 = setTimeout(dibujarHuecos, 200); });
  }
})();
