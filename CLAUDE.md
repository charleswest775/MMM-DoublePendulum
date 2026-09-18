# MMM-ChaosTheory — context for Claude sessions

Charles's own MagicMirror² module. Goal: beautiful, *physically correct* chaos-theory
animations for his hallway mirror, as one page in a rotation of pages.

## What exists (v0.1.0)

- `MMM-ChaosTheory.js` — module shell: one canvas, `requestAnimationFrame` loop capped to
  `config.fps`, dt clamped to 100 ms, **`suspend()` cancels the loop and `resume()` starts a
  fresh run**. Simulations are pluggable classes on `window.ChaosSimulations` with
  `step(dt)` + `draw(ctx, w, h)`.
- `simulations/double-pendulum.js` — RK4 at a fixed 1/240 s substep, fading trail drawn in
  6 alpha bands (not per-segment alpha, which is costlier in software rendering). Physics is
  UMD-style so it can be `require`d in Node.
- `tests/` — `node --test`, no dependencies: energy conservation (< 1e-4 drift over 60 s),
  chaos (1e-9 rad start difference → macroscopic gap), small-angle regularity, trail cap.
  Keep physics verified by tests like these; "looks chaotic" is not evidence of correctness.

**Not yet done:** never run inside MagicMirror, never measured on the Pi. That's the first job.

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
