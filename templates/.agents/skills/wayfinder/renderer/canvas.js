(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /** Shows the error panel with `messages` and hides the stage. */
  function showErrors(messages) {
    document.getElementById('errors').hidden = false;
    document.getElementById('error-text').textContent = messages.join('\n');
    document.getElementById('stage').hidden = true;
  }

  /** Creates an SVG element with `attrs`, appended to `parent` when given. */
  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  /** Writes `value` to the clipboard; if that fails, shows it selected in the fallback box. Resolves true when copied. */
  async function copyText(value, { panel, box }) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      panel.hidden = false;
      box.value = value;
      box.focus();
      box.select();
      return false;
    }
  }

  /**
   * Owns the camera of one canvas: `world` is the group that pans and zooms inside `svg`, `stage`
   * carries the background grid and `pct` shows the zoom. A drawing file passes its elements and
   * keeps no camera state of its own.
   */
  function create({ svg, world, stage, pct, reduceMotion }) {
    const cam = { x: 0, y: 0, k: 1 };
    let anim = 0;
    let moved = false;
    let pinch = null;
    const pointers = new Map();
    function zoomAt(factor, sx, sy) {
      const k = Math.max(0.05, Math.min(3, cam.k * factor));
      cam.x = sx - (sx - cam.x) * (k / cam.k);
      cam.y = sy - (sy - cam.y) * (k / cam.k);
      cam.k = k;
      core.applyCam();
    }

    const core = {
      cam,
      // invariant: dockH is the bottom strip the timeline island covers, so camera fits keep nodes clear of it.
      dockH: 0,

      get moved() {
        return moved;
      },

      applyCam() {
        world.setAttribute('transform', `translate(${cam.x} ${cam.y}) scale(${cam.k})`);
        const cell = 24 * cam.k;
        stage.style.backgroundSize = `${cell}px ${cell}px`;
        stage.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
        pct.textContent = `${Math.round(cam.k * 100)}%`;
      },

      /** Stops a running camera animation. */
      stop() {
        cancelAnimationFrame(anim);
      },

      animateTo(target) {
        cancelAnimationFrame(anim);
        if (reduceMotion) {
          Object.assign(cam, target);
          core.applyCam();
          return;
        }
        const from = { ...cam };
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / 460);
          const ease = 1 - (1 - p) ** 3;
          cam.x = from.x + (target.x - from.x) * ease;
          cam.y = from.y + (target.y - from.y) * ease;
          cam.k = from.k + (target.k - from.k) * ease;
          core.applyCam();
          if (p < 1) anim = requestAnimationFrame(step);
        };
        anim = requestAnimationFrame(step);
      },

      /** The camera that fits the world-space box `b` inside the visible canvas. */
      fitTarget(b, maxK = 1) {
        const vw = svg.clientWidth;
        const vh = svg.clientHeight;
        const top = 84;
        // why: on a short window the timeline would leave the map almost no room, so it may overlap instead.
        const bottom = vh - top - Math.max(70, core.dockH) < 160 ? 70 : Math.max(70, core.dockH);
        const side = 32;
        const k = Math.max(0.05, Math.min(maxK, (vw - 2 * side) / b.w, (vh - top - bottom) / b.h));
        return {
          k,
          x: side + (vw - 2 * side - b.w * k) / 2 - b.x * k,
          y: top + (vh - top - bottom - b.h * k) / 2 - b.y * k,
        };
      },

      zoomAt,

      centerZoom(factor) {
        core.zoomAt(factor, svg.clientWidth / 2, svg.clientHeight / 2);
      },

      /** Wires drag-to-pan, pinch zoom and the wheel onto `svg`; `moved` tells a click from a drag. */
      bindInput() {
        svg.addEventListener('pointerdown', (e) => {
          if (e.target.closest('input')) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY });
          if (pointers.size === 1) moved = false;
          if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
            moved = true;
          }
        });

        svg.addEventListener('pointermove', (e) => {
          const prev = pointers.get(e.pointerId);
          if (!prev) return;
          const cur = { ...prev, x: e.clientX, y: e.clientY };
          if (pointers.size === 2 && pinch) {
            pointers.set(e.pointerId, cur);
            const [a, b] = [...pointers.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            cancelAnimationFrame(anim);
            core.zoomAt(d / Math.max(1, pinch.d), mx, my);
            cam.x += mx - pinch.mx;
            cam.y += my - pinch.my;
            core.applyCam();
            pinch = { d, mx, my };
            return;
          }
          if (!moved && Math.hypot(cur.x - prev.ox, cur.y - prev.oy) < 4) return;
          cancelAnimationFrame(anim);
          svg.setPointerCapture(e.pointerId);
          stage.classList.add('panning');
          cam.x += cur.x - prev.x;
          cam.y += cur.y - prev.y;
          moved = true;
          core.applyCam();
          pointers.set(e.pointerId, cur);
        });

        function endPointer(e) {
          pointers.delete(e.pointerId);
          if (pointers.size < 2) pinch = null;
          if (!pointers.size) stage.classList.remove('panning');
        }
        svg.addEventListener('pointerup', endPointer);
        svg.addEventListener('pointercancel', endPointer);

        svg.addEventListener(
          'wheel',
          (e) => {
            if (e.target.closest('input')) return;
            e.preventDefault();
            cancelAnimationFrame(anim);
            if (e.ctrlKey || e.metaKey) {
              core.zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
            } else {
              cam.x -= e.deltaX;
              cam.y -= e.deltaY;
              core.applyCam();
            }
          },
          { passive: false },
        );
      },
    };
    return core;
  }

  globalThis.CanvasCore = { showErrors, el, copyText, create };
})();
