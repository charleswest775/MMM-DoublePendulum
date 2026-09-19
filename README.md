# MMM-ChaosTheory

A [MagicMirror²](https://magicmirror.builders/) module that shows chaos theory in motion,
cycling through five simulations, each with its equations and live numbers underneath:

| key | what you see |
|---|---|
| `lorenz` | **The Lorenz attractor.** Three trajectories released 10⁻⁵ apart trace the butterfly as one white line, then split into red, green and blue, while the view turns slowly in 3D. |
| `pendulums` | **Sensitive dependence.** Five double pendulums released 10⁻⁶ rad apart swing as one, then fan out, with the angles to 7 decimals and a log-scale plot of their spread (a straight line = exponential divergence). |
| `basins` | **Fractal basins.** A pendulum over three magnets: each pixel is coloured by the magnet it ends over. Two bobs released 6×10⁻⁴ apart swing live and land on different magnets; then the view zooms ×10, ×100, ×1000 into the boundary where they started. |
| `logistic` | **The road to chaos.** The logistic map's bifurcation diagram paints itself, then a cobweb diagram sweeps r through period doubling into chaos, with the period and Lyapunov exponent. |
| `icons` | **Symmetry in chaos.** One point hopping chaotically, millions of times, develops a symmetric picture (Field & Golubitsky). |

A new simulation starts every `cycleSeconds`, and each time the module is shown again.

And two that aren't chaos, each meant for a page of its own (see [An atom page](#an-atom-page)
and [A fractal page](#a-fractal-page)):

| key | what you see |
|---|---|
| `zoom` | **Infinite zoom.** A dive into the Mandelbrot set or a Julia set, doubling the magnification every 2 s towards a point on its edge, with new detail at every scale, until 64-bit arithmetic runs out at about 10¹⁰×. Five dives, taking turns: Seahorse Valley, Elephant Valley, a Julia set's spiral, a three-armed star and the north bulb's filigree. |
| `atom` | **A Bohr-style atom.** The element's electrons circle the nucleus in their shells, the outermost in the colour of the element's family. Underneath: who discovered it, when, how, and when it joined the periodic table. A different element each time, all 118 before any repeats. |

Built for a **Raspberry Pi 3 without GPU acceleration**: everything is drawn by the CPU, so the
drawing is designed around what that costs (see [Performance](#performance)), and the animation
stops completely while the module is hidden.

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/charleswest775/MMM-ChaosTheory
```

No npm dependencies.

## Config

```js
{
	module: "MMM-ChaosTheory",
	position: "middle_center",
	config: {
		simulations: ["lorenz", "pendulums", "basins", "logistic", "icons"],
		cycleSeconds: 60,
		width: 900,
		height: 900,
		fps: 20,
		statsPanel: true
	}
}
```

| Option | Default | Description |
|---|---|---|
| `simulations` | all five | Which to show, in order. Also available: `doublePendulum` (the original single pendulum) |
| `cycleSeconds` | `60` | Move to the next simulation this often |
| `width`, `height` | `900` | Canvas size in pixels |
| `fps` | `20` | Frame-rate cap |
| `showMath` | `true` | Equations and live numbers under the canvas |
| `lorenzStyle` | `"rotate"` | `"exposure"`: fixed view, trails build up like a long-exposure photo. About a third of the CPU on a Pi |
| `pendulumStyle` | `"live"` | `"exposure"`: only the bobs' light trails, building up like a long-exposure photo of LED-tipped pendulums. About half the CPU on a Pi |
| `atomElements` | `[]` | `atom`: symbols to show, e.g. `["H", "Fe", "Au"]`. Empty = all 118 |
| `atomOrder` | `"shuffle"` | `atom`: `"sequence"` goes through them by atomic number |
| `zoomTargets` | `[]` | `zoom`: which dives, e.g. `["seahorse", "elephant"]`. Empty = all five: `seahorse`, `julia-spiral`, `elephant`, `star`, `north` |
| `zoomSeconds` | `2` | `zoom`: seconds per doubling of the magnification, at most. The zoom slows down when keyframes can't keep up |
| `zoomWorkers` | `2` | `zoom`: how many of the Pi's four cores render keyframes |
| `statsPanel` | `false` | A line under the math showing what the mirror spends: fps, CPU of Electron and the compositor, a bar per core, temperature, and the simulation cycle. Sampled by the module's `node_helper` from `/proc`, only while the module is shown |
| `debugStats` | `false` | Show achieved fps and per-frame timings in the corner of the screen |

## An atom page

A second instance of the module, showing only `atom`, makes a page of its own. With
[MMM-pages](https://github.com/edward-shen/MMM-pages), give each instance a class to tell them apart:

```js
{
	module: "MMM-ChaosTheory",
	classes: "page-chaos",
	position: "middle_center",
	config: { /* as above */ }
},
{
	module: "MMM-ChaosTheory",
	classes: "page-atom",
	position: "middle_center",
	config: {
		simulations: ["atom"],
		cycleSeconds: 60,   // longer than the page is shown: one element per showing
		width: 700,         // smaller than the chaos canvas: less to redraw, and room for the text
		height: 700,
		fps: 12             // the electrons move slowly, so this is smooth; on a Pi 3, half the CPU of 20
	}
},
{
	module: "MMM-pages",
	config: { modules: [[], ["page-chaos"], ["page-atom"]], /* … */ }
}
```

What's real in the picture: the electrons per shell, and the orbital periods, which follow
Kepler's third law T² ∝ r³ as circular orbits around a charge do (in Bohr's model r ∝ n² and
T ∝ n³, the same law). The radii are schematic, evenly spaced: true Bohr radii grow as n², and a
heavy atom's inner shells are a hundred times smaller than its outer ones. The numbers under the
history are Bohr's formulas for the innermost electron, which sees nearly the full nuclear
charge: r = a₀/Z, v = Zαc, E = −Z²·13.6 eV (gold's moves at 0.58 c).

"Joined the table" is 1869 for the 62 elements in Mendeleev's first table (which also had
didymium, later split into Pr and Nd, and lacked terbium, then in doubt); for later discoveries
the year the element was placed; from element 104 on, the year IUPAC fixed the name. The
histories are in `data/element-history.js`: corrections welcome.

The idea is from [MMM-AtomVisualizer](https://github.com/KristjanESPERANTO/MMM-AtomVisualizer)
(MIT), which animates DOM nodes with CSS at the display's refresh rate. This one draws on the
module's canvas, so the frame cap and `suspend()` apply. `data/elements.js` is derived from its
data (`tools/build-elements.js`), originally from
[Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON) (CC BY-SA 3.0).

## A fractal page

The same way, a third instance showing only `zoom`:

```js
{
	module: "MMM-ChaosTheory",
	classes: "page-fractal",
	position: "middle_center",
	config: {
		simulations: ["zoom"],
		cycleSeconds: 600,  // a new dive each time the page is shown
		width: 700,
		height: 700,
		fps: 12
	}
}
```

Each dive heads for a point exactly on the fractal's edge, so there is detail at every scale:
a Misiurewicz point of the Mandelbrot set, where the orbit of 0 lands on a repelling cycle
(found to full precision by Newton's method, and checked by the tests), or the repelling fixed
point of a Julia set. Near such a point the picture repeats itself, magnified by the cycle's
multiplier |ρ| and turned by its angle, so the zoom could go on for ever; what stops it is
arithmetic. A double carries 53 bits, and at about 2³⁴ (10¹⁰×) neighbouring pixels would be
only a thousand units in the last place apart. There the dive ends and holds its last picture,
which costs nothing to show. Going deeper would take perturbation theory and arbitrary
precision, a different program.

Colour is the smooth escape time ν = n + 1 − log₂ log<sub>R</sub>|z<sub>n</sub>| on a cyclic
gradient, in log ν, so the bands stay about as wide at every depth while the escape times grow;
black never escapes. The iteration limit follows the escape times: twice what all but one pixel
in a thousand of the last keyframe needed.

How it's drawn: web workers (`zoomWorkers`, on other cores) render a keyframe of the canvas's
size for every doubling, a few ahead. Each frame stretches one keyframe by up to 2× and draws
the next one in, sharp, over the middle, so the centre never looks enlarged. Keyframe times on
the Pi, per core, 700×700: 0.3–1.5 s for Elephant Valley, the star and the north bulb at any
depth; 2–6 s for the Julia spiral; Seahorse Valley 1 s at 2⁶ rising to 12 s at 2³⁰ (it spirals
so tightly, |ρ| = 1.04, that escape times keep growing). With two workers the zoom keeps its
2 s per doubling for most of a 30 s showing and slows down where it can't.

## Performance

Measured on the mirror (Pi 3 B+, Electron 42, software rendering, 900×900 canvas, 20 fps),
as CPU of the Electron processes plus the `cage` compositor over 60 s, in % of one core
(the Pi has four). Baseline mirror without the module: 0.2%.

| | % of one core | achieved fps |
|---|---|---|
| module **hidden** (e.g. another MMM-pages page) | **0.3** | 0 |
| `lorenz` (rotating) | 165 | 16 |
| `pendulums` (live) | 146 | 19 |
| `basins` (average over its sequence; ~7 while a picture is held) | 42 | 20 |
| `logistic` | 73 | 17 |
| `icons` (while developing, ~45 s; then ~7) | 66 | 17 |
| `atom`, 700×700 at 12 fps (elements with four shells or more; ~33 for lighter ones, drawn smaller) | 78 | 12 |
| `atom`, 700×700 at 20 fps | 150 | 20 |
| `zoom`, 700×700 at 12 fps, 2 workers | *not yet measured* | |
| `lorenzStyle: "exposure"` | 55 | 20+ |
| `pendulumStyle: "exposure"` | 66 | 20+ |
| *v0.1.0 single pendulum, 30 fps, for comparison* | *140 + cage* | |

Where a simulation can't reach 20 fps the Pi's renderer is saturated, so its CPU stays near
150% whatever `fps` is set to.

What costs what, from micro-benchmarks on the Pi (`dev/bench.js`):

- Any frame that changes the canvas costs ~2% of a core per fps, before drawing anything.
- On top of that, cost grows with the **area that changes**: Chromium redraws the bounding box
  of everything touched in a frame. Clearing all 900×900 doubles the cost. So the simulations
  draw only what's new (long-exposure trails, incremental plots) and avoid changing distant
  parts of the canvas in the same frame.
- JavaScript is not the bottleneck: step and draw take 0.1–3 ms per frame.
- The frame loop sleeps with `setTimeout` until a frame is due. A simulation showing a finished
  picture rests, and is only polled twice a second.

The fractal basin maps are rendered ahead of time (`node tools/render-basins.js`, ~2 min on
a Mac): at ~3.5 ms per pixel, a Pi 3 would need 47 minutes of CPU for one.

## Development

```bash
npm test                     # physics checks (node --test, no dependencies)
python3 -m http.server 8765  # then open http://localhost:8765/dev/preview.html
node tools/render-basins.js  # re-render assets/basins-*.png after changing the magnetic pendulum
```

The tests check the physics against known results rather than looks: energy conservation,
the Lorenz fixed points and Lyapunov exponent (≈ 0.906), exponential divergence of the
pendulums, the logistic map's bifurcation points and Feigenbaum ratio, the basins' three-fold
symmetry and convergence under a finer time step, the icons' n-fold symmetry, and for the atom
that every element's shells hold Z electrons, the periods obey T² ∝ r³, and every element has
its history. For the zoom: escape times, that each Mandelbrot target is a Misiurewicz point of
exactly its preperiod and period with a repelling cycle and each Julia target a repelling fixed
point, that the deepest view is still resolvable in 64 bits, and that the zoom never runs ahead
of its keyframes.

`dev/preview.html` runs the module outside MagicMirror, in a portrait 1200×1920 frame, with
hide/show buttons that follow MagicMirror's suspend/resume order.

## License

MIT
