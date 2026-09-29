# MMM-ChaosTheory — context for Claude sessions

Charles's own MagicMirror² module. Goal: beautiful, *physically correct* chaos-theory
animations for his hallway mirror, as one page in a rotation of pages.

## What exists (v1.0.0)

- `MMM-ChaosTheory.js` — module shell: one canvas plus an HTML caption (equations + live
  readout, updated 2×/s). Cycles through `config.simulations` every `cycleSeconds` and on each
  `resume()`. Loop: `setTimeout` until a frame is due, then one `requestAnimationFrame`.
  `suspend()` stops it; a sim with `resting = true` is polled only every 500 ms. While
  MagicMirror fades the module out (`hidden` is set at the start, `suspend()` comes after),
  frames draw nothing. `turns: { of, at }` lets modules on one MMM-pages page take turns: each
  counts showings (resume after suspend) and, off its turn, hides its wrapper and doesn't play.
- Simulations are classes on `window.ChaosSimulations` with `step(dt)`, `draw(ctx, w, h)`,
  optional `readout()` and static `info` (title, equations). UMD-style so physics runs in Node.
  `lorenz`, `pendulums`, `basins` (magnetic pendulum over pre-rendered maps in `assets/`),
  `logistic`, `icons`, `threeBody` (Burrau's Pythagorean problem, Lagrange's unstable triangle
  and the stable figure-eight, each with a ghost started 10⁻⁶ away; adaptive Dormand–Prince at
  10⁻¹², drawn as a long exposure), `billiards` (ellipse vs Bunimovich stadium, three balls
  10⁻⁶ rad apart in each; one table per frame in turn), `rule30` (a row at a time, 5 rows a
  second: each frame changes one strip), and the original `doublePendulum`. Measured on the Pi
  (900², 20 fps, over a 60 s showing): threeBody 76%, billiards 58%, rule30 28%.
- `tests/` — `node --test`, no dependencies, physics checked against known results.
- `dev/preview.html` runs the module in a desktop browser (serve with `node dev/serve.js`);
  `dev/bench.js` holds drawing micro-benchmarks for the Pi, `dev/cpu-trace.py` traces its CPU;
  `tools/render-basins.js` renders the basin maps.

## The family (split out on 2026-09-28)

Up to v0.4.0 this repo also held the pages that aren't chaos. Each is now its own public repo,
carried out with its history by git filter-repo, with the shell renamed and its globals
(`window.<Prefix>Simulations`, `<Prefix>Ephemeris`…) and CSS classes prefixed so modules can't
clash: MMM-Atom (atom + orbital), MMM-FractalZoom, MMM-Chladni, MMM-SacredGeometry, MMM-Tilings,
MMM-PlanetsDance, MMM-SnowCrystal, MMM-NightSky, MMM-PhotoDeck, all under github.com/charleswest775
and checked out side by side in `~/dev/mirror-modules/`. Each has its own CLAUDE.md. The shell
(module file, node_helper's stats panel, dev/preview.html) is the same in all of them: a fix to it
here probably belongs in the siblings too.

## The mirror's rotation (config.js in the setup repo)

chaos (60 s; one simulation per showing) → photos (20) → atom (45; MMM-Atom, atom and orbital in
turn) → photos → fractal (30; MMM-FractalZoom and MMM-Chladni taking turns) → photos → sacred
(30; MMM-SacredGeometry, MMM-Tilings, MMM-PlanetsDance taking turns) → photos → sky (30) →
snow (30, MMM-SnowCrystal, since 2026-09-28) → photos, ~5½ minutes.

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
  pm2's log; restore the checkout and restart after.
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

- This repo is public so the Pi can `git clone`/`git pull` without credentials. It is listed
  on modules.magicmirror.builders (the wiki's 3rd-party modules page, Education), as are its
  siblings; keep `screenshot.png` and the README's Installation / Update / Configuration
  sections, which the list's checks look for.
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
