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

And some that aren't chaos, each meant for a page of its own (see [An atom page](#an-atom-page),
[A fractal page](#a-fractal-page), [A sacred geometry page](#a-sacred-geometry-page),
[A planets' dance page](#a-planets-dance-page), [A Chladni page](#a-chladni-page) and
[A photo page](#a-photo-page)):

| key | what you see |
|---|---|
| `zoom` | **Infinite zoom.** A dive into the Mandelbrot set or a Julia set, doubling the magnification every 2 s towards a point on its edge, with new detail at every scale, until 64-bit arithmetic runs out at about 10¹⁰×. Five dives, taking turns: Seahorse Valley, Elephant Valley, a Julia set's spiral, a three-armed star and the north bulb's filigree. |
| `sacred` | **Sacred geometry.** A figure no one has seen before, drawn from the centre out with compass and straightedge, every symmetric copy at once: the Seed or Flower of Life, Metatron's Cube, stars within stars, a mystic rose, a whirl, golden spirals or a lotus, ringed by star polygons, petals, beads, arcades or rings after Whorld. Then it holds, finished. |
| `orbits` | **The planets' dance.** Real orbits from today, drawn as figures that look like sacred geometry: the line between Earth and Venus every 4 days for 8 years makes a five-petalled rose; Mars, Jupiter or Saturn seen from Earth loop back each time we overtake them; every meeting of Jupiter and Saturn for 800 years, joined in order, is Kepler's turning triangle. Then it holds. |
| `chladni` | **Chladni figures.** Sand scattered on a square plate with free edges; the plate sings one of its modes, the grains hop off the parts that move and come to rest on the lines that don't, and the figure appears. Then it holds. 49 figures, one per showing, with the note a real steel plate would sound and the story of the figures (Chladni, Napoleon's prize, Sophie Germain, Ritz). |
| `orbital` | **The quantum atom.** Hydrogen's electron in one of 30 states, shown the only way it can be seen: one measurement at a time, each dot a place it was found, with probability \|ψ\|². The picture develops like a long exposure, lobes coloured by ψ's sign, around Bohr's orbit for the same energy (dashed). Meant to share the atom's page. |
| `atom` | **A Bohr-style atom.** The element's electrons circle the nucleus in their shells, the outermost in the colour of the element's family. Underneath: who discovered it, when, how, and when it joined the periodic table. A different element each time, all 118 before any repeats. |
| `photos` | **A photo.** One of your own pictures, held still, with the date it was taken. A different one each time, all of them before any repeats. |

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
| `orbitalSeconds` | `22` | `orbital`: the exposure; then it holds |
| `orbitalRate` | `16000` | `orbital`: measurements per second |
| `zoomTargets` | `[]` | `zoom`: which dives, e.g. `["seahorse", "elephant"]`. Empty = all five: `seahorse`, `julia-spiral`, `elephant`, `star`, `north` |
| `zoomSeconds` | `2` | `zoom`: seconds per doubling of the magnification, at most. The zoom slows down when keyframes can't keep up |
| `zoomWorkers` | `2` | `zoom`: how many of the Pi's four cores render keyframes |
| `sacredSeconds` | `22` | `sacred`: seconds to draw a figure; then it holds |
| `sacredSeed` | none | `sacred`: draw this figure every time, by the number shown under it, e.g. `"3A7F21C0"` |
| `sacredFolds` | `[]` | `sacred`: symmetries to choose from, e.g. `[6, 12]`. Empty = all: 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 18, 20, 24 |
| `sacredPalettes` | `[]` | `sacred`: colours to choose from, e.g. `["gold", "sapphire"]`. Empty = all: `gold`, `sapphire`, `rose`, `jade`, `amethyst`, `silver`, `spectrum`, `fire`, `aurora` |
| `orbitsSeconds` | `22` | `orbits`: seconds to draw a figure; then it holds |
| `chladniSeconds` | `14` | `chladni`: the longest the plate sings; it stops sooner once the sand has settled (8–12 s) |
| `chladniGrains` | `22000` | `chladni`: grains of sand |
| `orbitsDances` | `[]` | `orbits`: which figures, e.g. `["venus", "trigon"]`. Empty = all eight: `venus`, `venus-loops`, `mercury`, `mars`, `jupiter-saturn`, `trigon`, `jupiter`, `saturn`, one per showing, all before any repeats |
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

### The quantum atom

List `orbital` with `atom` on the atom's page and they take turns, one per showing: Bohr's
picture of 1913, then Schrödinger's of 1926.

```js
config: {
	simulations: ["atom", "orbital"],
	cycleSeconds: 60,   // one per showing, taking turns
	width: 700,
	height: 700,
	fps: 12
}
```

Each showing takes hydrogen's electron in one of 30 states |n l m⟩, from 1s to 6h, and plots
where it is found, one measurement at a time: ~350,000 dots in 22 s, each drawn at random with
probability |ψ|² (Born's rule) in a thin slice through the nucleus, the plane containing the z
axis, so the lobes, nodal planes and cones, and the radial nodes (n − l − 1 of them) show. Four
of them are circular states (m = l = n − 1), seen from above in the plane they circle in: a ring
whose most likely distance from the nucleus is exactly the radius of Bohr's orbit, n²a₀. Dashed
on every picture is Bohr's orbit for the same n; the energies, −13.6 eV/n², are the same in both
theories. Dots are warm where ψ is positive and cool where it's negative (on a ring, ψ's real
part, whose phase winds m times round). The readout samples distances from the radial
distribution r²R², so their mean can be watched converging on ⟨r⟩ = ½(3n² − l(l+1)) a₀.

The wavefunctions are exact: ψ = R_nl(r) Y_l^m(θ, φ) from the associated Laguerre and Legendre
functions. The tests check the polynomials, the normalisation, orthogonality and nodes of R_nl,
⟨r⟩ and the circular states' most likely radius against their formulas, the nodal plane of p_z
and cones of d_z², and that the sampled mean converges on ⟨r⟩.

For the Pi: dots are counted per cell of a 640 × 640 grid, and turned into colour and drawn
four times a second, not every frame (~70% of the canvas each time); after the exposure the
sim rests. Not yet measured on the Pi.

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

On the mirror (see [Performance](#performance)) the drawing alone costs ~130% of a core at
12 fps: a stretched 700×700 image every frame, where the atom only redraws what moves. The
workers add ~25% each on the cheap dives and up to ~100% each on Seahorse Valley and the Julia
spiral. The Pi ran at 70–73 °C through the measurements. With the page hidden, the workers use
nothing.

## A sacred geometry page

Another instance, showing only `sacred`:

```js
{
	module: "MMM-ChaosTheory",
	classes: "page-sacred",
	position: "middle_center",
	config: {
		simulations: ["sacred"],
		cycleSeconds: 600,  // one figure per showing, a new one each time the page comes round
		sacredSeconds: 22,  // drawn in 22 s of a 30 s page, then held
		width: 700,
		height: 700,
		fps: 12
	}
}
```

Each showing makes a new figure from a random 32-bit seed, and draws it the way it would be
drawn by hand: from the centre out, the compass first, then the straightedge. Every symmetric
copy is drawn at once by a pen of its own, so the figure is symmetric at every moment. In
mirror-symmetric figures each element is drawn symmetrically too: a circle by two pens setting
off in opposite directions from its point nearest the centre, a line from its middle out to
both ends; so circles through the centre bloom out of it. A third of the figures turn instead:
whirls, pinwheels, leaning petals, and pens that all go round the same way. Lines are added
with `lighter` compositing, so where they cross they brighten, as light does, around a soft glow
at the centre.

A figure is a core, one to three bands and a rim:

- **cores**: the Seed of Life (six circles through the centre, each centred on the first, so the
  compass never changes) or up to 30 circles through the centre; the Flower of Life (circles on
  a triangular lattice, cut off at the boundary: 19 whole circles and the arcs completing the
  petals); Metatron's Cube (the Fruit of Life's 13 circles and the 78 lines between their
  centres); stars within stars (each star's crossing sides are the next one's points: each
  pentagram is 1/φ² the last); a whirl of pursuit polygons, each with its corners a little way
  along the last one's sides, so every corner runs in on a logarithmic spiral; a times table,
  point j of N joined to point (n + 1)·j, whose lines' envelope is an epicycloid with n cusps
  (with one, the cardioid), or to (1 − n)·j, a hypocycloid; a mystic rose, every chord of its points;
  spirals crossing like a sunflower's seeds, golden ones growing by φ each quarter turn; a lotus.
- **bands**, each on the circle the last ended on: star polygons {k/q} whose sides touch that
  circle (so their points are at r / cos(πq/k)); lotus petals; beads touching the circle and
  each other; an arcade of arches; rings after [Whorld](https://victimofleisure.github.io/Whorld/),
  each a star with its corners pulled in or out by a factor swinging on a sine as Whorld's
  oscillators do, twisted further the farther out it is; logarithmic spirals; rays; rosettes,
  small Seeds of Life repeating the figure in miniature, as
  [OmniGeometry](https://www.omnigeometry.com/sacred-geometry-software/) draws a shape at the
  points of itself.

The symmetry is one of 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 18, 20 or 24, and the caption gives the
side of its regular polygon and whether it could really be drawn with compass and straightedge
alone: by the Gauss–Wantzel theorem only when n is a power of 2 times distinct Fermat primes
(3, 5, 17, 257, 65537), so the 7-, 9- and 18-gons' corners are computed, not constructed.
Spirals and Whorld's Bézier curves can't be drawn with compass and straightedge either: the
readout says "by hand" while they're drawn. No two figures in a row share their core, palette
or symmetry. The number under a finished figure draws it again (`sacredSeed`), and
`dev/sacred-gallery.html` shows a wall of them to choose from.

Inspired by Quentin Carpenter's
[108 Sacred Geometry Animations](https://www.youtube.com/watch?v=_--7KU0oZOc) (light lines on
black around a glowing centre), [evoluteur/sacred-geometry](https://github.com/evoluteur/sacred-geometry)
(figures that draw themselves stroke by stroke, from circles and lines only), Whorld and
OmniGeometry.

For the Pi, each frame adds only what the pens drew since the last one, and once the figure is
finished the sim rests. Measured on the mirror over six showings (see [Performance](#performance)):
~42% of a core while a figure is being drawn (27–63% in 3-s windows: the pens are spread round
the figure, so a frame's changes span much of it), ~117% for the first 3 s as the page fades in
and the glow with it, then ~3% while the finished figure is held, most of that the stats panel.
Over a 30 s showing, ~41%: the cheapest of the animated pages. It holds 12 fps throughout, so
the figure is finished on time, ~24 s after the page appears.

## A planets' dance page

Another instance, showing only `orbits`:

```js
{
	module: "MMM-ChaosTheory",
	classes: "page-orbits",
	position: "middle_center",
	config: {
		simulations: ["orbits"],
		cycleSeconds: 600,  // one figure per showing
		orbitsSeconds: 22,  // drawn in 22 s of a 30 s page, then held
		width: 700,
		height: 700,
		fps: 12
	}
}
```

Each showing draws one of eight figures from today's date, with time running evenly, so a
planet lingers where it really moves slowly:

- **Earth and Venus**, the line between them every 4 days for 8 years: a five-petalled rose,
  because 8 Earth years (2922.1 days) ≈ 13 Venus years (2921.1) ≈ 5 laps of Earth by Venus
  (5 × 583.9). **Earth and Mercury**, every 3 days for 7 years: 22 laps, 29 Mercury years.
  **Jupiter and Saturn**, every month for three of Jupiter's laps of Saturn (60 years).
- **Venus, Mars, Jupiter or Saturn seen from Earth**: the planet's position minus Earth's,
  with Earth at the centre and the Sun's yearly circle round it. It loops back each time one
  overtakes the other: Venus 5 times in 8 years, at the corners of a pentagram; Mars 7 times
  in 15; Jupiter 11 times, Saturn 28, in one of their years. Ptolemy's epicycles were built to
  reproduce exactly these loops.
- **Kepler's trigon**: every conjunction of Jupiter and Saturn from the one of 2020 on for 800
  years, joined in order on the circle of the zodiac. Each is 243° on from the last, so three
  make a triangle that turns 9° every 60 years, and after 40 the meetings are back in the same
  signs. Longitudes are measured from the equinox of each date, which precesses 1.4° a century,
  as Kepler's were.

Positions come from JPL's *Keplerian Elements for Approximate Positions of the Major Planets*
(Standish): each orbit an ellipse whose elements drift linearly, fitted to JPL's DE ephemeris,
good to arcseconds for the inner planets and arcminutes for Saturn from 1800 to 2050 (Table 1),
and coarser from 3000 BC to AD 3000 (Table 2, used outside those years). The tests check them
against the almanacs: Venus's inferior conjunctions of 2020–2026 and Mars's oppositions of
2018–2027 to the day, Jupiter and Saturn 0.10° apart on 21 December 2020, and the conjunction of
December 1603 that Kepler watched.

Drawn like sacred geometry: each frame adds only what is new, with `lighter` compositing, and
the finished figure rests. Measured in a desktop browser by diffing frames, a frame changes on
average 15% of the canvas for the line figures and under 1% for the loops, against 48% for
sacred geometry, so the page should cost the Pi no more than that one does.

## A Chladni page

Another instance, showing only `chladni`:

```js
{
	module: "MMM-ChaosTheory",
	classes: "page-chladni",
	position: "middle_center",
	config: {
		simulations: ["chladni"],
		cycleSeconds: 600,  // one figure per showing
		width: 700,
		height: 700,
		fps: 12
	}
}
```

Each showing scatters sand on a square plate with free edges and makes it sing one of its first
49 modes, up to λ = 470. Where the plate moves, its acceleration throws the grains up and they
land a little way off, more often downhill, away from the bigger motion; where it moves less
than a threshold it can't throw them, only nudge them onto the nodal line. So the sand leaves
the moving parts and draws the lines that stand still, in 8–12 s, and the figure holds. Modes
odd in x or y are still at the centre, where Chladni held his plates and bowed them at an edge;
the others are shaken at the centre, as a vibrator does today. A pair of modes with the same
frequency (one the other turned through 90°) makes two figures, their sum and difference. Under
the sand, a faint tint shows the mode itself: warm where the plate is up, cool where it's down.

The modes are solved by the method Walther Ritz invented for this very plate in 1909
(`simulations/plate.js`): the deflection as a mix of products of a free–free beam's modes,
X_m(x)X_n(y), 12 of each parity each way, with the mix that makes the plate's bending energy
stationary against its kinetic energy: a matrix eigenproblem for each of the square's four
parity classes. `node tools/chladni-modes.js` writes them to `data/chladni-modes.js`, so the
Pi doesn't solve anything. The tests check the frequencies against Leissa's *Vibration of
Plates* (13.468, 19.596, 24.270, 34.801, 61.093, 63.686 for ν = 0.3; all within 0.4%, from
above, as Ritz's method gives upper bounds), the shapes' symmetries, orthogonality, and that the
sand ends up on the nodal lines. The caption gives λ = ωa²√(ρh/D) and what a 20 cm steel plate
1 mm thick would sound, with the nearest note, and one of five stories: Chladni in 1787,
Napoleon's prize and Sophie Germain's win in 1816, Kirchhoff's edge conditions and Ritz,
Faraday's powder that goes the other way, and violin makers' glitter.

For the Pi: the sand is a pixel buffer, and each frame puts back only the rectangle of pixels
whose grains moved. While the sand moves that is most of the plate, ~75% of the canvas (like the
atom, which costs ~78% of a core at this size and rate), for 8–12 s; then the sim rests. Not yet
measured on the Pi; JavaScript takes ~1.3 ms a frame on a Mac.

## A photo page

A page that shows one photo, still, between the animations: after an animation the Pi gets a
rest, without the screen going empty. Once the photo is drawn the module rests: measured on
the mirror, ~1% of a core while a photo is held, against 75–330% for the animations around it.

```js
{
	module: "MMM-ChaosTheory",
	classes: "page-photos",
	position: "middle_center",
	config: {
		simulations: ["photos"],
		cycleSeconds: 3600,  // a new photo each time the page is shown
		width: 900,          // on a landscape screen, wider photos reach the clock in the corner
		height: 1000,
		fps: 4               // only matters for the moment before the photo is drawn
	}
}
```

MagicMirror calls `resume()` only after a page has faded in, so the module clears its canvas
when it's hidden instead — otherwise the last picture would be what fades in. The photo page
goes further: it picks and draws its next photo while hidden, ready to be faded in. (The
simulations can't: they would animate, and `zoom` would run its workers, unseen.)

List the class on more than one page, e.g.
`modules: [["page-chaos"], ["page-photos"], ["page-atom"], ["page-photos"]]`, and each
showing brings the next photo. They're shuffled; each is shown once before any repeats.

The photos come from `~/mirror-photos` on the mirror (or the folder in the `MIRROR_PHOTOS`
environment variable): JPEG, PNG or WebP, served by the module's `node_helper`. **Resize them
beforehand**: decoding a 12-megapixel phone photo takes the Pi far longer than decoding one
of about the canvas's size. The date under the photo comes from its EXIF (`DateTimeOriginal`);
without one the photo has no caption. On a Mac, for example:

```bash
sips -s format jpeg -s formatOptions 85 -Z 1600 IMG_1234.HEIC --out ~/resized/IMG_1234.jpg
rsync -a ~/resized/ pi@mirror.local:mirror-photos/
```

`sips` keeps the EXIF, including the orientation, which Chromium applies when drawing.

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
| `zoom`, 700×700 at 12 fps, 2 workers (first 30 s of a dive: Elephant Valley, the star, the north bulb) | 155–168 | 13 |
| `zoom`, the same, Seahorse Valley / the Julia spiral | 234 / 270 | 13 |
| `photos`, 900×1000, while the photo is held (a spike to ~150 for the 2 s it takes to appear) | 1 | 0 |
| `sacred`, 700×700 at 12 fps, while a figure is drawn (~117 for the first 3 s, the page's fade-in and the glow; 27–63 in 3-s windows) | 42 | 12 |
| `sacred`, the finished figure held, with the stats panel on | 3 | 0 |
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
node dev/serve.js            # then open http://localhost:8765/dev/preview.html
node tools/render-basins.js  # re-render assets/basins-*.png after changing the magnetic pendulum
node tools/chladni-modes.js  # re-solve the Chladni plate's modes into data/chladni-modes.js
```

With the server running, `/dev/sacred-gallery.html` shows a wall of finished sacred geometry
figures; click one to watch it being drawn.

The tests check the physics against known results rather than looks: energy conservation,
the Lorenz fixed points and Lyapunov exponent (≈ 0.906), exponential divergence of the
pendulums, the logistic map's bifurcation points and Feigenbaum ratio, the basins' three-fold
symmetry and convergence under a finer time step, the icons' n-fold symmetry, and for the atom
that every element's shells hold Z electrons, the periods obey T² ∝ r³, and every element has
its history. For the zoom: escape times, that each Mandelbrot target is a Misiurewicz point of
exactly its preperiod and period with a repelling cycle and each Julia target a repelling fixed
point, that the deepest view is still resolvable in 64 bits, and that the zoom never runs ahead
of its keyframes. For sacred geometry: that the Flower of Life has its 19 circles and Metatron's
Cube its 13 circles and 78 lines, that star polygons' sides touch the circle they should and
nested pentagrams shrink by 1/φ², that pursuit polygons' corners lie on the last one's sides,
that a golden spiral grows by φ a quarter turn, which polygons are constructible (checked
against OEIS A003401), and, for many random figures, that each fills the unit circle and has
the n-fold (and mirror) symmetry it claims, and that every stroke is drawn exactly once. For
the planets: conjunctions and oppositions against the almanacs, JPL's two tables against each
other, Kepler's third law, Venus's 8-year cycle and the 2.4° its pentagram turns in it, Mars
going backwards at opposition, and the trigon's 243° steps. For the Chladni plate: the beam
modes' frequencies and orthonormality, the plate's frequencies against Leissa's, the symmetries
of the lowest modes, the data file against a fresh solve, and the sand on the nodal lines. For
the quantum atom: the special functions, the radial functions' normalisation, nodes and
orthogonality, ⟨r⟩, the circular states' radius, nodal planes and cones, and Born's rule in the
sampling.

`dev/preview.html` runs the module outside MagicMirror, in a portrait 1200×1920 frame, with
hide/show buttons that follow MagicMirror's suspend/resume order. `dev/serve.js` also serves
the photo page's photos, from `~/Pictures/Mirror` or the folder given as its first argument:
`?simulations=photos&width=1100&height=1000`.

## License

MIT
