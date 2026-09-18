// Physics checks for the double pendulum. Run: node --test
const test = require("node:test");
const assert = require("node:assert");
const { DoublePendulum } = require("../simulations/double-pendulum.js");

const run = (p, seconds, frame = 1 / 30) => { for (let t = 0; t < seconds; t += frame) p.step(frame); };

test("conserves energy (no friction in the model)", () => {
	const p = new DoublePendulum({ theta1: 2.0, theta2: 2.5 });
	const e0 = p.energy();
	run(p, 60);
	const drift = Math.abs((p.energy() - e0) / e0);
	assert.ok(drift < 1e-4, `relative energy drift after 60s was ${drift}`);
});

test("is chaotic: a 1e-9 rad difference grows to a macroscopic one", () => {
	const a = new DoublePendulum({ theta1: 2.0, theta2: 2.5 });
	const b = new DoublePendulum({ theta1: 2.0 + 1e-9, theta2: 2.5 });
	run(a, 30); run(b, 30);
	const [, , ax, ay] = a.positions(), [, , bx, by] = b.positions();
	const gap = Math.hypot(ax - bx, ay - by);
	assert.ok(gap > 0.1, `outer bobs only ${gap} apart after 30s`);
});

test("small swings behave like a normal pendulum (not chaotic)", () => {
	const a = new DoublePendulum({ theta1: 0.05, theta2: 0.05 });
	const b = new DoublePendulum({ theta1: 0.05 + 1e-9, theta2: 0.05 });
	run(a, 30); run(b, 30);
	const [, , ax, ay] = a.positions(), [, , bx, by] = b.positions();
	assert.ok(Math.hypot(ax - bx, ay - by) < 1e-6);
});

test("trail is capped", () => {
	const p = new DoublePendulum({ theta1: 2, theta2: 2, trailLength: 50 });
	run(p, 10);
	assert.strictEqual(p.trail.length, 50);
});
