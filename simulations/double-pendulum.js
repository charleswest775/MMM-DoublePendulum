/* Double pendulum, integrated with fixed-step RK4.
 * Registers itself on window.ChaosSimulations so the module can pick it by name.
 * Pure math in step(); all drawing in draw(), so the physics can be tested in Node.
 */
(function (root) {
	const G = 9.81;

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
			this.trail = [];
			this.trailLength = trailLength;
			this.substep = 1 / 240; // fixed physics step, independent of frame rate
		}

		derivs ([t1, w1, t2, w2]) {
			const { m1, m2, l1, l2 } = this;
			const d = t1 - t2;
			const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
			const a1 = (-G * (2 * m1 + m2) * Math.sin(t1)
				- m2 * G * Math.sin(t1 - 2 * t2)
				- 2 * Math.sin(d) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(d))) / (l1 * den);
			const a2 = (2 * Math.sin(d) * (w1 * w1 * l1 * (m1 + m2)
				+ G * (m1 + m2) * Math.cos(t1)
				+ w2 * w2 * l2 * m2 * Math.cos(d))) / (l2 * den);
			return [w1, a1, w2, a2];
		}

		rk4 (h) {
			const s = this.s;
			const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
			const k1 = this.derivs(s);
			const k2 = this.derivs(add(s, k1, h / 2));
			const k3 = this.derivs(add(s, k2, h / 2));
			const k4 = this.derivs(add(s, k3, h));
			this.s = s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
		}

		step (dt) {
			for (let t = 0; t < dt; t += this.substep) this.rk4(this.substep);
			const [, , x2, y2] = this.positions();
			this.trail.push([x2, y2]);
			if (this.trail.length > this.trailLength) this.trail.shift();
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
			ctx.clearRect(0, 0, w, h);

			// trail: a few alpha bands instead of per-segment alpha (cheaper in software rendering)
			const bands = 6, n = this.trail.length;
			ctx.strokeStyle = this.color;
			ctx.lineWidth = 1.5;
			for (let b = 0; b < bands; b++) {
				const from = Math.floor((b * n) / bands), to = Math.floor(((b + 1) * n) / bands);
				if (to - from < 2) continue;
				ctx.globalAlpha = 0.08 + 0.5 * ((b + 1) / bands);
				ctx.beginPath();
				ctx.moveTo(px(this.trail[from][0]), py(this.trail[from][1]));
				for (let i = from + 1; i <= Math.min(to, n - 1); i++) ctx.lineTo(px(this.trail[i][0]), py(this.trail[i][1]));
				ctx.stroke();
			}

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
	root.ChaosSimulations.doublePendulum = DoublePendulum;
	if (typeof module !== "undefined") module.exports = { DoublePendulum };
})(typeof window !== "undefined" ? window : globalThis);
