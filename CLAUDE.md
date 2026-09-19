# MMM-ChaosTheory — context for Claude sessions

Charles's own MagicMirror² module. Goal: beautiful, *physically correct* chaos-theory
animations for his hallway mirror, as one page in a rotation of pages.

## What exists (v0.3.0)

- `MMM-ChaosTheory.js` — module shell: one canvas plus an HTML caption (equations + live
  readout, updated 2×/s). Cycles through `config.simulations` every `cycleSeconds` and on each
  `resume()`. Loop: `setTimeout` until a frame is due, then one `requestAnimationFrame`.
  `suspend()` stops it; a sim with `resting = true` is polled only every 500 ms.
- Simulations are classes on `window.ChaosSimulations` with `step(dt)`, `draw(ctx, w, h)`,
  optional `readout()` and static `info` (title, equations). UMD-style so physics runs in Node.
  `lorenz`, `pendulums`, `basins` (magnetic pendulum over pre-rendered maps in `assets/`),
  `logistic`, `icons`, and the original `doublePendulum`.
- `atom` is not chaos: a Bohr-style atom for a page of its own (second module instance with
  `classes: "page-atom"`, see README). One element per sim instance, so `cycleSeconds` and
  `resume()` move to the next element. A sim instance may set `this.info` to supply its own
  caption. `data/elements.js` is generated (`tools/build-elements.js`);
  `data/element-history.js` (who / when / how / joined the table) is hand-written. After
  KristjanESPERANTO/MMM-AtomVisualizer, which is DOM + CSS animation: no fps cap, wrong for the Pi.
  Measured on the Pi: every electron moves, so the whole atom is redrawn and cost is fps × area:
  ~150% at 20 fps, 78% at 12 fps (700² canvas), ~33% for atoms with under four shells. The mirror
  runs it at 12 fps with orbits slow enough to look smooth.
- `zoom` is not chaos either: an infinite zoom into the Mandelbrot set / Julia sets, a page of
  its own (`classes: "page-fractal"`). `simulations/zoom-math.js` (escape times, Misiurewicz
  targets by Newton, colours) is shared with `zoom-worker.js`; keyframes per doubling are
  rendered by web workers, and `zoom.js` draws two of them scaled each frame. Full-canvas
  redraw every frame, plus 1–2 cores of workers while shown. The module calls `sim.dispose()`
  (if present) when it replaces a sim, which terminates the workers.
- `tests/` — `node --test`, no dependencies, physics checked against known results.
- `dev/preview.html` runs the module in a desktop browser; `dev/bench.js` holds drawing
  micro-benchmarks for the Pi; `tools/render-basins.js` renders the basin maps.

## Performance findings on the Pi (measured, see README)

- Hidden: 0.3% of one core (baseline 0.2%) — suspend() verified via MMM-Remote-Control hide.
- A frame that changes the canvas costs ~2%/fps fixed; beyond that, cost scales with the
  **bounding box of everything changed in the frame**. Full redraws of a 900² canvas at 20 fps
  saturate the pipeline (~150%). JS is never the bottleneck (<3 ms/frame).
- So: draw incrementally (long-exposure trails), keep each frame's changes spatially compact,
  and rest when the picture is static. Line width, opacity, `rAF` vs timer made no difference.
- MagicMirror applies `electronSwitches` after app ready, so `remote-debugging-port` can't be
  set that way; use `debugStats: true` and a `grim` screenshot to see fps on the Pi.

## Ideas Charles liked

- Double pendulum with fading trail (done)
- **Divergence demo**: many pendulums (e.g. 20-50) with starting angles 1e-6 apart, drawn
  together — they move as one, then fan out. Best single illustration of sensitive dependence.
- **Lorenz attractor** tracing its butterfly, slowly rotating in 3D (projected to 2D).
- Optionally cycle simulations within one showing, or pick one per showing.

## Hard constraints: the target device

- **Raspberry Pi 3 B+, 905 MB RAM, 64-bit Debian 13.** Mirror runs Electron 42 in a cage
  Wayland kiosk.
- **No GPU acceleration, and it can't be enabled**: the Pi 3's VideoCore IV only does GLES 2.0,
  Chromium needs ES 3.0 (tested). All canvas drawing is CPU. **No WebGL / three.js.**
- Screen will be **portrait 1200×1920** once mounted (Dell U2413, rotated). Design for portrait.
- Electron baseline is ~0.5% of one core. A full-screen 60 fps canvas could cost a lot more.
  **Measure, don't guess**: on the Pi, `~/.cache/mm-sample.sh 60` prints Electron CPU% and RSS
  over 60 s. Record before/after numbers in the README.
- The mirror rotates pages every 15-30 s (MMM-pages, which hides/shows modules). Verify that
  `suspend()`/`resume()` actually fire on page changes. If the loop keeps running while
  hidden, it burns CPU 24/7.

## Deploying and testing

- This repo is public so the Pi can `git clone`/`git pull` without credentials.
- Pi access: `ssh fatherson@raspberrypi.local` (key auth). Module path:
  `~/MagicMirror/modules/MMM-ChaosTheory`. Restart: `pm2 restart MagicMirror`
  (pm2 is in `~/.npm-global/bin`). Logs: `pm2 logs MagicMirror`.
- The mirror's **config.js lives in a separate private repo**, `charleswest775/magicmirror-setup`
  (cloned at `~/dev/magicmirror-setup`). Add the module's config block there, then
  `./deploy.sh diff` and `./deploy.sh push` (push validates config before restarting).
  Don't hand-edit config.js on the Pi without `./deploy.sh pull` afterwards.
- Faster iteration: run MagicMirror on the Mac in a browser rather than redeploying to the
  Pi for every tweak, then confirm performance on the Pi.
- Commit as Charles's GitHub noreply address (see git config in this repo).
