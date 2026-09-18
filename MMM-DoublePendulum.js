/* MagicMirror² module: MMM-ChaosTheory
 * Animated chaos-theory simulations drawn on a 2D canvas.
 * Designed for low-power displays (Raspberry Pi 3, no GPU): frame-rate capped,
 * and the animation stops entirely while the module is hidden (e.g. by MMM-pages).
 */
Module.register("MMM-ChaosTheory", {
	defaults: {
		simulation: "doublePendulum", // key in window.ChaosSimulations
		width: 900,                   // canvas size in CSS pixels
		height: 900,
		fps: 30,                      // frame cap; lower = less CPU
		resetSeconds: 60,             // start a fresh run (new initial conditions) this often
		color: "#ffffff"
	},

	getScripts () {
		return [this.file("simulations/double-pendulum.js")];
	},

	getStyles () {
		return ["MMM-ChaosTheory.css"];
	},

	start () {
		this.canvas = null;
		this.sim = null;
		this.rafId = null;
		this.lastFrame = 0;
		this.startedAt = 0;
		this.visible = true;
	},

	getDom () {
		// Build the canvas once; MagicMirror may call getDom again on updateDom.
		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			this.canvas.className = "chaos-canvas";
			this.canvas.width = this.config.width;
			this.canvas.height = this.config.height;
		}
		const wrapper = document.createElement("div");
		wrapper.className = "chaos-wrapper";
		wrapper.appendChild(this.canvas);
		return wrapper;
	},

	notificationReceived (notification) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.newRun();
			this.play();
		}
	},

	// Called by MagicMirror when the module is hidden/shown (MMM-pages uses hide/show).
	suspend () {
		this.visible = false;
		this.pause();
	},

	resume () {
		this.visible = true;
		this.newRun(); // a fresh run each time the page comes round
		this.play();
	},

	newRun () {
		const Sim = window.ChaosSimulations && window.ChaosSimulations[this.config.simulation];
		if (!Sim) {
			Log.error(`[MMM-ChaosTheory] unknown simulation: ${this.config.simulation}`);
			return;
		}
		this.sim = new Sim({ color: this.config.color });
		this.startedAt = performance.now();
	},

	play () {
		if (this.rafId !== null || !this.canvas || !this.sim) return;
		const frameInterval = 1000 / this.config.fps;
		const ctx = this.canvas.getContext("2d");

		const tick = (now) => {
			this.rafId = requestAnimationFrame(tick);
			const elapsed = now - this.lastFrame;
			if (elapsed < frameInterval) return;
			// clamp dt so a stalled frame doesn't explode the integrator
			const dt = Math.min(elapsed, 100) / 1000;
			this.lastFrame = now;

			if (now - this.startedAt > this.config.resetSeconds * 1000) this.newRun();
			this.sim.step(dt);
			this.sim.draw(ctx, this.canvas.width, this.canvas.height);
		};
		this.lastFrame = performance.now();
		this.rafId = requestAnimationFrame(tick);
	},

	pause () {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}
});
