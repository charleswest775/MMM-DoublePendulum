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

test("simulated time tracks real time regardless of frame timing", () => {
	// the same 10 s of real time delivered as steady and as jittery frames
	const steady = new DoublePendulum({ theta1: 0.3, theta2: 0.2 });
	const jittery = new DoublePendulum({ theta1: 0.3, theta2: 0.2 });
	let substeps = 0;
	const rk4 = jittery.rk4.bind(jittery);
	jittery.rk4 = (h) => { substeps++; rk4(h); };
	for (let i = 0; i < 300; i++) steady.step(1 / 30);
	const frames = [0.02, 0.05, 0.03, 0.015, 1 / 6 - 0.115]; // sums to 1/6 s
	for (let i = 0; i < 60; i++) for (const f of frames) jittery.step(f);
	assert.ok(Math.abs(substeps - 2400) <= 1, `${substeps} substeps for 10 s at 240 Hz`);
	assert.ok(Math.abs(steady.s[0] - jittery.s[0]) < 1e-2);
});

test("trail is capped", () => {
	const p = new DoublePendulum({ theta1: 2, theta2: 2, trailLength: 50 });
	run(p, 10);
	assert.strictEqual(p.trail.length, 50);
});
