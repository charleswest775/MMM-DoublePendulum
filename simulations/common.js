/* Shared helpers for the simulations: a fixed-step clock, a fading trail, colours.
 * UMD-style so the physics that uses them can be tested in Node.
 */
(function (root) {
	// Runs step(h) in fixed substeps so simulated time tracks real time exactly,
	// whatever the frame timing. Returns the number of substeps taken.
	class FixedClock {
		constructor (substep) {
			this.substep = substep;
			this.pending = 0;
		}

		advance (dt, step) {
			this.pending += dt;
			let n = 0;
			while (this.pending >= this.substep) {
				step(this.substep);
				this.pending -= this.substep;
				n++;
			}
			return n;
		}
	}

	// Ring buffer of 2D points drawn as a line that fades towards its tail. Drawn in a few
	// alpha bands rather than per-segment alpha: far fewer strokes in software rendering.
	class Trail {
		constructor (capacity) {
			this.capacity = capacity;
			this.xy = new Float32Array(capacity * 2);
			this.start = 0;
			this.length = 0;
		}

		push (x, y) {
			const i = ((this.start + this.length) % this.capacity) * 2;
			this.xy[i] = x; this.xy[i + 1] = y;
			if (this.length < this.capacity) this.length++;
			else this.start = (this.start + 1) % this.capacity;
		}

		clear () { this.start = 0; this.length = 0; }

		// k = 0 is the oldest point
		x (k) { return this.xy[((this.start + k) % this.capacity) * 2]; }
		y (k) { return this.xy[((this.start + k) % this.capacity) * 2 + 1]; }

		draw (ctx, { color, lineWidth = 1.5, bands = 6, minAlpha = 0.05, maxAlpha = 0.9, map = (x, y) => [x, y] }) {
			const n = this.length;
			if (n < 2) return;
			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			for (let b = 0; b < bands; b++) {
				const from = Math.floor((b * (n - 1)) / bands), to = Math.floor(((b + 1) * (n - 1)) / bands);
				if (to <= from) continue;
				ctx.globalAlpha = minAlpha + (maxAlpha - minAlpha) * ((b + 1) / bands) ** 1.5;
				ctx.beginPath();
				let [px, py] = map(this.x(from), this.y(from));
				ctx.moveTo(px, py);
				for (let k = from + 1; k <= to; k++) {
					[px, py] = map(this.x(k), this.y(k));
					ctx.lineTo(px, py);
				}
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}
	}

	// n evenly spaced vivid hues, as CSS colours
	const palette = (n, { start = 0, s = 90, l = 62 } = {}) =>
		Array.from({ length: n }, (_, i) => `hsl(${(start + (360 * i) / n) % 360}, ${s}%, ${l}%)`);

	// format a small positive number as a power of ten, e.g. 3.2×10⁻⁷
	const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
	const sci = (v, digits = 1) => {
		if (!isFinite(v) || v === 0) return "0";
		const e = Math.floor(Math.log10(Math.abs(v)));
		if (e >= -2 && e <= 3) return v.toFixed(Math.max(0, digits + 1 - e));
		return `${(v / 10 ** e).toFixed(digits)}×10${String(e).replace(/./g, (c) => SUP[c])}`;
	};

	const Chaos = { FixedClock, Trail, palette, sci };
	root.ChaosCommon = Chaos;
	root.ChaosSimulations = root.ChaosSimulations || {};
	if (typeof module !== "undefined") module.exports = Chaos;
})(typeof window !== "undefined" ? window : globalThis);
