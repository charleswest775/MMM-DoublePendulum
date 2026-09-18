/* Divergence demo: several double pendulums released a millionth of a radian apart.
 * They swing as one, then fan out. Additive blending makes the coincident pendulums
 * glow white until they separate into their own colours. Below them, the spread is
 * plotted on a log scale: a straight rising line is exponential divergence.
 */
(function (root) {
	const { FixedClock, Trail, palette, sci } = root.ChaosCommon || require("./common.js");
	const { DoublePendulum } = root.ChaosSimulations && root.ChaosSimulations.doublePendulum
		? { DoublePendulum: root.ChaosSimulations.doublePendulum }
		: require("./double-pendulum.js");

	const TRAIL = 140;
	// angle in (−π, π]: a pendulum that has gone over the top has the same angle mod 2π
	const wrap = (r) => r - 2 * Math.PI * Math.round(r / (2 * Math.PI));

	class Pendulums {
		constructor ({ count = 5, separation = 1e-6, runSeconds = 30, theta1, theta2 } = {}) {
			this.count = count;
			this.separation = separation;
			this.runSeconds = runSeconds;
			this.colors = palette(count, { start: Math.random() * 360 });
			this.fixed = { theta1, theta2 };
			this.release();
		}

		release () {
			const rand = () => Math.PI * (0.6 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1);
			const t1 = this.fixed.theta1 ?? rand(), t2 = this.fixed.theta2 ?? rand();
			this.pendulums = Array.from({ length: this.count }, (_, i) =>
				new DoublePendulum({ theta1: t1 + i * this.separation, theta2: t2 }));
			this.trails = this.pendulums.map(() => new Trail(TRAIL));
			this.clock = new FixedClock(1 / 240);
			this.t = 0;
			this.history = []; // [t, log10(spread)] samples for the plot
		}

		// largest angular difference (rad, around the circle so at most π) between any two
		// pendulums, over both arms
		spread () {
			const ps = this.pendulums;
			let m = 0;
			for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
				for (const k of [0, 2]) m = Math.max(m, Math.abs(wrap(ps[i].s[k] - ps[j].s[k])));
			}
			return m;
		}

		step (dt) {
			if (this.t > this.runSeconds) this.release();
			this.clock.advance(dt, (h) => { for (const p of this.pendulums) p.rk4(h); this.t += h; });
			this.pendulums.forEach((p, i) => { const [, , x, y] = p.positions(); this.trails[i].push(x, y); });
			const last = this.history[this.history.length - 1];
			if (!last || this.t - last[0] >= 0.25) this.history.push([this.t, Math.log10(Math.max(this.spread(), 1e-12))]);
		}

		draw (ctx, w, h) {
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, w, h);
			const plotH = Math.round(h * 0.2);
			const size = Math.min(w, h - plotH);
			const scale = size / 4.4, cx = w / 2, cy = (h - plotH) / 2 - size * 0.05;
			const map = (x, y) => [cx + x * scale, cy + y * scale];

			ctx.globalCompositeOperation = "lighter";
			this.pendulums.forEach((p, i) => {
				this.trails[i].draw(ctx, { color: this.colors[i], lineWidth: 2, bands: 5, minAlpha: 0.03, maxAlpha: 0.7, map });
			});
			this.pendulums.forEach((p, i) => {
				const [x1, y1, x2, y2] = p.positions();
				const [ax, ay] = map(x1, y1), [bx, by] = map(x2, y2);
				ctx.strokeStyle = ctx.fillStyle = this.colors[i];
				ctx.globalAlpha = 0.55;
				ctx.lineWidth = 2.5;
				ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
				ctx.globalAlpha = 0.8;
				ctx.beginPath(); ctx.arc(ax, ay, 6, 0, 2 * Math.PI); ctx.arc(bx, by, 9, 0, 2 * Math.PI); ctx.fill();
			});
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "source-over";
			ctx.fillStyle = "#bbb";
			ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();

			this.drawPlot(ctx, 0, h - plotH, w, plotH);
		}

		// log10(spread) against time, from 10⁻⁷ rad up to π
		drawPlot (ctx, x0, y0, w, h) {
			const pad = 44, left = x0 + pad, right = x0 + w - 12, top = y0 + 10, bottom = y0 + h - 22;
			const lo = -7, hi = 0.5;
			const X = (t) => left + (right - left) * (t / this.runSeconds);
			const Y = (lg) => bottom - (bottom - top) * ((Math.min(hi, Math.max(lo, lg)) - lo) / (hi - lo));
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#333";
			ctx.fillStyle = "#777";
			ctx.font = "13px Roboto Condensed, sans-serif";
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			for (let e = lo + 1; e <= 0; e += 2) {
				ctx.beginPath(); ctx.moveTo(left, Y(e)); ctx.lineTo(right, Y(e)); ctx.stroke();
				ctx.fillText(e === 0 ? "1" : `10${String(e).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d])}`, left - 6, Y(e));
			}
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
			ctx.fillText("spread between pendulums (rad, log scale)", left, bottom + 5);
			if (this.history.length < 2) return;
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 2;
			ctx.beginPath();
			this.history.forEach(([t, lg], k) => (k ? ctx.lineTo(X(t), Y(lg)) : ctx.moveTo(X(t), Y(lg))));
			ctx.stroke();
		}

		readout () {
			const deg = (r) => wrap(r).toFixed(7).padStart(10, "\u2007");
			const rows = this.pendulums.map((p, i) =>
				`<span style="color:${this.colors[i]}">θ₁ = ${deg(p.s[0])}   θ₂ = ${deg(p.s[2])}</span>`);
			return `${rows.join("\n")}\nt = ${this.t.toFixed(1)} s    spread ${sci(this.spread())} rad`;
		}
	}

	Pendulums.info = {
		title: "Sensitive dependence",
		subtitle: "five double pendulums released 10⁻⁶ rad apart",
		equations: [
			"θ̈₁ = <span class=\"frac\"><span>−3g sin θ₁ − g sin(θ₁ − 2θ₂) − 2 sin(θ₁ − θ₂) (θ̇₂² + θ̇₁² cos(θ₁ − θ₂))</span><span>3 − cos 2(θ₁ − θ₂)</span></span>",
			"θ̈₂ = <span class=\"frac\"><span>2 sin(θ₁ − θ₂) (2θ̇₁² + 2g cos θ₁ + θ̇₂² cos(θ₁ − θ₂))</span><span>3 − cos 2(θ₁ − θ₂)</span></span>",
			"<span class=\"chaos-note\">equal masses, 1 m arms, g = 9.81 m/s² — integrated with RK4 at 240 steps per second</span>"
		]
	};

	root.ChaosSimulations = root.ChaosSimulations || {};
	root.ChaosSimulations.pendulums = Pendulums;
	if (typeof module !== "undefined") module.exports = { Pendulums };
})(typeof window !== "undefined" ? window : globalThis);
