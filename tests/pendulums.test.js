// Checks for the divergence demo. Run: node --test
const test = require("node:test");
const assert = require("node:assert");
const { Pendulums } = require("../simulations/pendulums.js");

const run = (sim, seconds, frame = 1 / 20) => { for (let t = 0; t < seconds; t += frame) sim.step(frame); };

test("pendulums start 1e-6 rad apart and move as one at first", () => {
	const sim = new Pendulums({ theta1: 2.0, theta2: 2.4 });
	assert.ok(Math.abs(sim.spread() - 4e-6) < 1e-12, "five pendulums span 4 separations");
	run(sim, 2);
	assert.ok(sim.spread() < 1e-3, `already ${sim.spread()} rad apart after 2 s`);
});

test("then they fan out to macroscopically different motions", () => {
	const sim = new Pendulums({ theta1: 2.0, theta2: 2.4 });
	run(sim, 25);
	assert.ok(sim.spread() > 0.5, `only ${sim.spread()} rad apart after 25 s`);
});

test("each pendulum still conserves its energy", () => {
	const sim = new Pendulums({ theta1: 2.0, theta2: 2.4 });
	const e0 = sim.pendulums.map((p) => p.energy());
	run(sim, 25);
	sim.pendulums.forEach((p, i) => assert.ok(Math.abs((p.energy() - e0[i]) / e0[i]) < 1e-4));
});

test("the spread grows exponentially (straight line on the log plot)", () => {
	const sim = new Pendulums({ theta1: 2.0, theta2: 2.4 });
	run(sim, 25);
	// fit log10(spread) against t while it is still small: a positive slope, fairly straight
	const pts = sim.history.filter(([, lg]) => lg < -2);
	const n = pts.length, mt = pts.reduce((s, p) => s + p[0], 0) / n, ml = pts.reduce((s, p) => s + p[1], 0) / n;
	const sxy = pts.reduce((s, [t, l]) => s + (t - mt) * (l - ml), 0), sxx = pts.reduce((s, [t]) => s + (t - mt) ** 2, 0);
	const syy = pts.reduce((s, [, l]) => s + (l - ml) ** 2, 0);
	const slope = sxy / sxx, r = sxy / Math.sqrt(sxx * syy);
	assert.ok(slope > 0.1, `log10 spread rose only ${slope} per second`);
	assert.ok(r > 0.8, `correlation ${r}: not a clean exponential`);
});

test("re-releases a fresh set after runSeconds", () => {
	const sim = new Pendulums({ runSeconds: 5 });
	run(sim, 6);
	assert.ok(sim.t < 1.5, `run clock at ${sim.t}`);
});

test("spread measures angles around the circle, so never exceeds π", () => {
	const sim = new Pendulums({ theta1: 2.0, theta2: 2.4 });
	sim.pendulums[1].s[0] += 2 * Math.PI; // same position, one full turn on
	assert.ok(sim.spread() < 1e-5);
	run(sim, 25);
	assert.ok(sim.spread() <= Math.PI + 1e-12);
});
