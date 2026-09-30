# MMM-DoublePendulum

A [MagicMirror²](https://magicmirror.builders/) module that releases five double pendulums 10⁻⁶ rad apart and shows them swing as one, then fan out, drawn for a Raspberry Pi without a GPU.

![Five double pendulums fanned out in five colours, the log plot of their spread, and the equations and angles under it](screenshot.png)

## What you see

**Sensitive dependence.** Five double pendulums released 10⁻⁶ rad apart swing as one, then fan
out, with the angles to 7 decimals and a log-scale plot of their spread (a straight line =
exponential divergence). While they agree their colours add up to white; as they part, each
shows its own. A new set is released every 30 s. Or, with `pendulumStyle: "exposure"`, only the
outer bobs' light trails, building up like a long-exposure photograph of LED-tipped pendulums.

Under them: the equations of motion, and a readout of both angles of every pendulum, the time
since release and the spread.

Also here, as `doublePendulum`: the original single double pendulum, with a fading trail behind
its outer bob, released at random each time.

Built for a **Raspberry Pi 3 without GPU acceleration**: everything is drawn by the CPU, so the
drawing is designed around what that costs, and the animation stops completely while the module
is hidden (see [Performance](#performance)).

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/charleswest775/MMM-DoublePendulum
```

No npm dependencies: there is nothing to install.

## Update

```bash
cd ~/MagicMirror/modules/MMM-DoublePendulum
git pull
```

## Configuration

```js
{
	module: "MMM-DoublePendulum",
	position: "middle_center",
	config: {
		simulations: ["pendulums"],
		pendulumStyle: "live",
		width: 900,
		height: 900,
		fps: 20
	}
},
```

| Option | Default | Description |
|---|---|---|
| `simulations` | `["pendulums"]` | Which to show, in turn: `"pendulums"` (five, released 10⁻⁶ rad apart) and `"doublePendulum"` (the single one). `["doublePendulum"]` for the single one only, `["pendulums", "doublePendulum"]` for both |
| `pendulumStyle` | `"live"` | `pendulums`: `"live"` draws arms, bobs and fading trails. `"exposure"`: only the outer bobs' light trails, building up like a long-exposure photograph of LED-tipped pendulums. About half the CPU on a Pi |
| `cycleSeconds` | `60` | Move to the next simulation (or start the one afresh) this often; that also happens each time the module is shown again |
| `width`, `height` | `900` | Canvas size in pixels |
| `fps` | `20` | Frame-rate cap |
| `showMath` | `true` | Equations and live numbers under the canvas |
| `turns` | `null` | Take turns with other modules on the same page, e.g. `{ of: 2, at: 1 }` (see [Taking turns](#taking-turns)) |
| `statsPanel` | `false` | A line under the math showing what the mirror spends: fps, CPU of Electron and the compositor, a bar per core, temperature, and the simulation cycle. Sampled by the module's `node_helper` from `/proc`, only while the module is shown |
| `debugStats` | `false` | Show achieved fps and per-frame timings in the corner of the screen |

## Taking turns

With `turns: { of: n, at: k }`, modules on the same [MMM-pages](https://github.com/edward-shen/MMM-pages)
page each show on their own one in n showings of it: `at: 0` on the first showing and every
nth after it, `at: 1` on the second, and so on. A module that isn't on its turn takes no room on
the page and costs nothing: it hides its canvas and doesn't start. So one slot in the rotation
can hold several pages, without making the rotation longer. For example, the pendulums and
[MMM-LorenzAttractor](https://github.com/charleswest775/MMM-LorenzAttractor)'s butterfly, one
per showing:

```js
{
	module: "MMM-DoublePendulum",
	classes: "page-chaos",
	position: "middle_center",
	config: { turns: { of: 2, at: 0 } }
},
{
	module: "MMM-LorenzAttractor",
	classes: "page-chaos",
	position: "middle_center",
	config: { turns: { of: 2, at: 1 } }
},
{
	module: "MMM-pages",
	config: { modules: [["page-clock"], ["page-chaos"]], rotationTime: 60000 }
},
```

Without `turns` the module shows every time. It works just as well on a page of its own, or in
a normal region without MMM-pages, where it moves on every `cycleSeconds`.

## What's real

Each double pendulum is two equal masses on massless, rigid 1 m arms, with g = 9.81 m/s² and no
friction (`simulations/double-pendulum.js`). Its full, nonlinear equations of motion are
integrated by the fourth-order Runge–Kutta method at a fixed 240 steps per second, in fixed
substeps, so the simulated time keeps pace with real time however the frames fall.

The five (`simulations/pendulums.js`) are released from rest, both arms at a random angle
between 0.6π and 0.95π either side of hanging straight down, the upper arms 10⁻⁶ rad apart
from one pendulum to the next. The spread is the largest difference between any two of them in
the angle of either arm, taken around the circle, so at most π; it is plotted once a second,
on a log scale from 10⁻⁷ rad. A difference that grows exponentially is a straight rising line
on that plot, until the spread is as large as it can be. The readout gives each pendulum's
angles in radians, between −π and π, to 7 decimals. The single pendulum starts with both arms
at a random 0.55π–0.95π either side, and keeps its outer bob's last 600 positions as its trail.

The tests check the physics against known results rather than looks: the double pendulum
conserves its energy (to 10⁻⁴ over 60 s); two released 10⁻⁹ rad apart at large angles end up
more than 10 cm apart after 30 s, while small swings stay together, as a simple pendulum's
would; simulated time tracks real time with jittery frames. And for the five: they start
4×10⁻⁶ rad apart, are still within 10⁻³ rad after 2 s and more than 0.5 rad apart after 25 s,
each conserves its energy, the logarithm of their spread rises in a straight line, and the
spread is measured around the circle.

## Performance

Measured on a Raspberry Pi 3 B+ (Electron 42, software rendering), 900×900 at 20 fps, as CPU
of the Electron processes plus the `cage` compositor over 60 s, in % of one core (the Pi has
four); baseline mirror without the module: 0.2%.

| | % of one core | achieved fps |
|---|---|---|
| module **hidden** (e.g. another MMM-pages page) | 0.3 | 0 |
| `pendulums`, `pendulumStyle: "live"` | 146 | 19 |
| `pendulums`, `pendulumStyle: "exposure"` | 66 | 20+ |
| *the single pendulum as first written (v0.1.0), at 30 fps* | *140 + cage* | |

The live style is close to all the Pi's renderer can do: where a simulation can't reach its
frame rate the renderer is saturated, and the CPU stays near 150% whatever `fps` is set to. The
long exposure only adds what is new, at less than half the cost. `doublePendulum` clears and
redraws the whole canvas every frame, and full redraws of a 900×900 canvas at 20 fps saturate
the renderer; it hasn't been measured as it is now.

Why it costs what it does, from micro-benchmarks on the Pi:

- There is no GPU acceleration to be had (the Pi 3's GPU only does GLES 2.0; Chromium needs
  3.0), so every pixel is drawn by the CPU.
- Any frame that changes the canvas costs ~2% of a core per fps, before drawing anything.
- On top of that, cost grows with the **area that changes**: Chromium redraws the bounding box
  of everything touched in a frame. So the live style clears and redraws only the box around the
  pendulums and their trails (this frame's and the last frame's), and adds to the plot below
  only once a second, as each new point widens the area that frame changes; the long exposure
  draws only the tips' paths since the last frame.
- JavaScript is not the bottleneck: step and draw take 0.1–3 ms per frame.
- The frame loop sleeps with `setTimeout` until a frame is due. While MagicMirror² fades the
  module out, nothing new is drawn; once it is hidden, the loop stops.

## Development

```bash
node --test              # physics checks (no dependencies)
python3 -m http.server   # then open http://localhost:8000/dev/preview.html
```

`dev/preview.html` runs the module outside MagicMirror², in a portrait 1200×1920 frame, with
hide/show buttons that follow MagicMirror²'s suspend/resume order. Query options override the
config, e.g. `?pendulumStyle=exposure`, `?simulations=doublePendulum`, or
`?simulations=pendulums,doublePendulum&cycleSeconds=30` for both in turn.

## License

MIT

Part of a family of MagicMirror² modules. Chaos, one simulation each:
[MMM-LorenzAttractor](https://github.com/charleswest775/MMM-LorenzAttractor),
[MMM-FractalBasins](https://github.com/charleswest775/MMM-FractalBasins),
[MMM-LogisticMap](https://github.com/charleswest775/MMM-LogisticMap),
[MMM-SymmetricIcons](https://github.com/charleswest775/MMM-SymmetricIcons),
[MMM-ThreeBody](https://github.com/charleswest775/MMM-ThreeBody),
[MMM-ChaoticBilliards](https://github.com/charleswest775/MMM-ChaoticBilliards),
[MMM-Rule30](https://github.com/charleswest775/MMM-Rule30),
[MMM-StandardMap](https://github.com/charleswest775/MMM-StandardMap),
[MMM-ChaoticWaterwheel](https://github.com/charleswest775/MMM-ChaoticWaterwheel) and
[MMM-Sandpile](https://github.com/charleswest775/MMM-Sandpile), or all eleven in
one module, [MMM-ChaosTheory](https://github.com/charleswest775/MMM-ChaosTheory).
And more pages of physics and mathematics:
[MMM-Atom](https://github.com/charleswest775/MMM-Atom),
[MMM-DoubleSlit](https://github.com/charleswest775/MMM-DoubleSlit),
[MMM-FractalZoom](https://github.com/charleswest775/MMM-FractalZoom),
[MMM-Chladni](https://github.com/charleswest775/MMM-Chladni),
[MMM-SacredGeometry](https://github.com/charleswest775/MMM-SacredGeometry),
[MMM-Tilings](https://github.com/charleswest775/MMM-Tilings),
[MMM-PlanetsDance](https://github.com/charleswest775/MMM-PlanetsDance),
[MMM-Harmonograph](https://github.com/charleswest775/MMM-Harmonograph),
[MMM-SnowCrystal](https://github.com/charleswest775/MMM-SnowCrystal) and
[MMM-NightSky](https://github.com/charleswest775/MMM-NightSky).
