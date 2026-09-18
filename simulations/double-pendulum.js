/* Double pendulum, integrated with fixed-step RK4.
 * Registers itself on window.ChaosSimulations so the module can pick it by name.
 * Pure math in step(); all drawing in draw(), so the physics can be tested in Node.
 */
(function (root) {
	const { Trail } = root.ChaosCommon || require("./common.js");
	const G = 9.81;
	const K = [0, 1, 2, 3].map(() => new Float64Array(4)); // RK4 scratch, shared

	class DoublePendulum {
		constructor ({ color = "#ffffff", theta1, theta2, trailLength = 600 } = {}) {
			this.m1 = 1; this.m2 = 1;
			this.l1 = 1; this.l2 = 1;
			// random start high enough to be chaotic (> ~90° gives rich motion)
			this.s = [
				theta1 ?? Math.PI * (0.55 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1),
				0,
				theta2 ?? Math.PI * (0.55 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1),
				0
			]; // [θ1, ω1, θ2, ω2]
			this.color = color;
			this.trail = new Trail(trailLength);
			this.substep = 1 / 240; // fixed physics step, independent of frame rate
			this.pending = 0;       // real time not yet integrated (less than one substep)
		}

		// [θ̇1, θ̈1, θ̇2, θ̈2] at state (t1, w1, t2, w2), written into out (no allocation: this runs
		// four times per 1/240 s substep for every pendulum on screen)
		derivs (t1, w1, t2, w2, out) {
			const { m1, m2, l1, l2 } = this;
			const d = t1 - t2, sd = Math.sin(d), cd = Math.cos(d);
			const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
			out[0] = w1;
			out[1] = (-G * (2 * m1 + m2) * Math.sin(t1)
				- m2 * G * Math.sin(t1 - 2 * t2)
				- 2 * sd * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cd)) / (l1 * den);
			out[2] = w2;
			out[3] = (2 * sd * (w1 * w1 * l1 * (m1 + m2)
				+ G * (m1 + m2) * Math.cos(t1)
				+ w2 * w2 * l2 * m2 * cd)) / (l2 * den);
		}

		rk4 (h) {
			const s = this.s, [k1, k2, k3, k4] = K;
			this.derivs(s[0], s[1], s[2], s[3], k1);
			this.derivs(s[0] + k1[0] * h / 2, s[1] + k1[1] * h / 2, s[2] + k1[2] * h / 2, s[3] + k1[3] * h / 2, k2);
			this.derivs(s[0] + k2[0] * h / 2, s[1] + k2[1] * h / 2, s[2] + k2[2] * h / 2, s[3] + k2[3] * h / 2, k3);
			this.derivs(s[0] + k3[0] * h, s[1] + k3[1] * h, s[2] + k3[2] * h, s[3] + k3[3] * h, k4);
			for (let i = 0; i < 4; i++) s[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
		}

		step (dt) {
			// accumulate so simulated time tracks real time exactly, whatever the frame timing
			this.pending += dt;
			while (this.pending >= this.substep) {
				this.rk4(this.substep);
				this.pending -= this.substep;
			}
			const [, , x2, y2] = this.positions();
			this.trail.push(x2, y2);
		}

		positions () {
			const [t1, , t2] = this.s;
			const x1 = this.l1 * Math.sin(t1), y1 = this.l1 * Math.cos(t1);
			return [x1, y1, x1 + this.l2 * Math.sin(t2), y1 + this.l2 * Math.cos(t2)];
		}

		energy () {
			const { m1, m2, l1, l2 } = this;
			const [t1, w1, t2, w2] = this.s;
			const ke = 0.5 * m1 * (l1 * w1) ** 2
				+ 0.5 * m2 * ((l1 * w1) ** 2 + (l2 * w2) ** 2 + 2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2));
			const pe = -(m1 + m2) * G * l1 * Math.cos(t1) - m2 * G * l2 * Math.cos(t2);
			return ke + pe;
		}

		draw (ctx, w, h) {
			const scale = Math.min(w, h) / (2.2 * (this.l1 + this.l2));
			const cx = w / 2, cy = h / 2;
			const px = (x) => cx + x * scale, py = (y) => cy + y * scale;
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, w, h);
			this.trail.draw(ctx, { color: this.color, lineWidth: 1.5, bands: 6, minAlpha: 0.08, maxAlpha: 0.58, map: (x, y) => [px(x), py(y)] });

			// arms and bobs
			const [x1, y1, x2, y2] = this.positions();
			ctx.globalAlpha = 1;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(cx, cy); ctx.lineTo(px(x1), py(y1)); ctx.lineTo(px(x2), py(y2));
			ctx.stroke();
			ctx.fillStyle = this.color;
			for (const [x, y] of [[x1, y1], [x2, y2]]) {
				ctx.beginPath(); ctx.arc(px(x), py(y), 8, 0, 2 * Math.PI); ctx.fill();
			}
		}
	}

	root.ChaosSimulations = root.ChaosSimulations || {};
	DoublePendulum.info = { title: "The double pendulum", subtitle: "two arms, and no way to predict where they will be" };
	root.ChaosSimulations.doublePendulum = DoublePendulum;
	if (typeof module !== "undefined") module.exports = { DoublePendulum };
})(typeof window !== "undefined" ? window : globalThis);
