# MMM-ChaosTheory — context for Claude sessions

Charles's own MagicMirror² module. Goal: beautiful, *physically correct* chaos-theory
animations for his hallway mirror, as one page in a rotation of pages.

## What exists (v0.3.0)

- `MMM-ChaosTheory.js` — module shell: one canvas plus an HTML caption (equations + live
  readout, updated 2×/s). Cycles through `config.simulations` every `cycleSeconds` and on each
  `resume()`. Loop: `setTimeout` until a frame is due, then one `requestAnimationFrame`.
  `suspend()` stops it; a sim with `resting = true` is polled only every 500 ms. While
  MagicMirror fades the module out (`hidden` is set at the start, `suspend()` comes after),
  frames draw nothing.
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
  redraw every frame, plus 1–2 cores of workers while shown. Measured on the Pi (700², 12 fps,
  2 workers): 155–270% of a core, ~130% of it drawing; 70–73 °C; workers 0% when hidden. The module calls `sim.dispose()`
  (if present) when it replaces a sim, which terminates the workers.
- `photos` is not chaos: Charles's photos, each held still (the sim rests) with the date taken
  under it, the next crossfading in every `photoSeconds` (5: four to the 20 s page, in 0.8 s,
  `photoFadeSeconds`). Each is composed once on its own canvas while the last is held; a fade
  redraws only the box around both photos. Photos got ready but not shown go back on the deck
  (`dispose()`), and a new deck keeps the last ten dealt off its start. A page of its own
  (`classes: "page-photos"`), listed between the animation pages so the Pi gets its rest
  without an empty screen. `node_helper.js`
  serves `~/mirror-photos` on the Pi (list + files, dates from EXIF via `photo-index.js`).
  **The photos are private: never commit them to this public repo.** Charles's curated
  originals live in `~/Pictures/Mirror` on the Mac; `mac/sync-mirror-photos.sh` in the setup
  repo resizes them (sips, 1600 px, EXIF kept) and rsyncs them to the Pi. Measured on the Pi
  (900×1000, `fps: 20`): ~1% while a photo is held; a crossfade 140–170% for its 0.8 s at a
  steady 20 fps, then 40–80% for ~0.4 s laying out the next photo; 39% over the 20 s page (was
  14% with one photo; the page change itself is ~180% for a second). The mirror rotates chaos →
  photos → atom → photos → fractal → photos → sacred → photos, 20 s per photo page.
- `sacred` is not chaos: sacred geometry, a page of its own (`classes: "page-sacred"`). Each
  showing, `simulations/sacred-geometry.js` composes a new n-fold figure from a random 32-bit
  seed (a core — Seed/Flower of Life, Metatron's Cube, star cascade, whirl, times table, mystic
  rose, spirals, lotus — then bands and a rim) as layers → steps → strokes in unit coordinates;
  `sacred.js` draws it stroke by stroke from the centre out, every symmetric copy at once,
  incrementally with `lighter` compositing, then rests. The seed is shown under the figure;
  `sacredSeed` redraws it; `dev/sacred-gallery.html` shows many at once. Measured on the Pi (700²,
  12 fps, six showings): ~42% of a core while drawing (~117% for the first 3 s of fade-in and
  glow), ~3% once held (stats panel); ~41% over a 30 s showing, 12 fps held, done ~24 s in.
- `tests/` — `node --test`, no dependencies, physics checked against known results.
- `dev/preview.html` runs the module in a desktop browser (serve with `node dev/serve.js`,
  which also serves photos from `~/Pictures/Mirror`); `dev/bench.js` holds drawing
  micro-benchmarks for the Pi, `dev/cpu-trace.py` traces its CPU; `tools/render-basins.js`
  renders the basin maps.

## Performance findings on the Pi (measured, see README)

- Hidden: 0.3% of one core (baseline 0.2%) — suspend() verified via MMM-Remote-Control hide.
- A frame that changes the canvas costs ~2%/fps fixed; beyond that, cost scales with the
  **bounding box of everything changed in the frame**. Full redraws of a 900² canvas at 20 fps
  saturate the pipeline (~150%). JS is never the bottleneck (<3 ms/frame).
- So: draw incrementally (long-exposure trails), keep each frame's changes spatially compact,
  and rest when the picture is static. Line width, opacity, `rAF` vs timer made no difference.
- MagicMirror applies `electronSwitches` after app ready, so `remote-debugging-port` can't be
  set that way; use `debugStats: true` and a `grim` screenshot to see fps on the Pi. For exact
  frame times without the screen (photos show on it): patch the Pi's checkout for a while to
  `sendSocketNotification` each frame's rAF time and have `node_helper.js` `console.log` it into
  pm2's log; `git checkout` and restart after.
- Per-page cost: `dev/cpu-trace.py` on the Pi traces Electron + cage every 0.25 s. MMM-pages'
  timings are fixed, so find one page change and the rest follow; average pages second by second.

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
