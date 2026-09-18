/* MagicMirror² module: MMM-ChaosTheory
 * Animated chaos-theory simulations drawn on a 2D canvas, with the math underneath.
 * Designed for low-power displays (Raspberry Pi 3, no GPU): frame-rate capped,
 * and the animation stops entirely while the module is hidden (e.g. by MMM-pages).
 */
Module.register("MMM-ChaosTheory", {
	defaults: {
		// shown in turn; each keyed in window.ChaosSimulations
		simulations: ["lorenz", "pendulums", "basins", "logistic", "icons"],
		cycleSeconds: 60,  // move to the next simulation this often (and each time the module is shown)
		width: 900,        // canvas size in CSS pixels
		height: 900,
		fps: 20,           // frame cap; lower = less CPU
		showMath: true,    // equations and live numbers under the canvas
		loop: "timer",     // "timer" (setTimeout + one rAF per drawn frame) or "raf" (rAF every vsync)
		opaque: true       // opaque canvas: the compositor needn't blend it with the page
	},

	getScripts () {
		return [
			"simulations/common.js",
			"simulations/double-pendulum.js",
			"simulations/pendulums.js",
			"simulations/lorenz.js",
			"simulations/magnetic-pendulum.js",
			"simulations/logistic.js",
			"simulations/icons.js"
		].map((f) => this.file(f));
	},

	getStyles () {
		return ["MMM-ChaosTheory.css"];
	},

	start () {
		this.canvas = null;
		this.sim = null;
		this.simIndex = -1;
		this.timer = null;   // pending setTimeout (loop: "timer")
		this.rafId = null;   // pending requestAnimationFrame
		this.running = false;
		this.lastFrame = 0;
		this.startedAt = 0;
		this.lastReadout = 0;
	},

	getDom () {
		// Build once; MagicMirror may call getDom again on updateDom.
		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			this.canvas.className = "chaos-canvas";
			this.canvas.width = this.config.width;
			this.canvas.height = this.config.height;
			this.ctx = this.canvas.getContext("2d", { alpha: !this.config.opaque });

			this.caption = document.createElement("div");
			this.caption.className = "chaos-caption";
			this.caption.style.width = `${this.config.width}px`;
			this.titleEl = document.createElement("div");
			this.titleEl.className = "chaos-title";
			this.mathEl = document.createElement("div");
			this.mathEl.className = "chaos-math";
			this.readoutEl = document.createElement("div");
			this.readoutEl.className = "chaos-readout";
			this.caption.append(this.titleEl, this.mathEl, this.readoutEl);
			if (!this.config.showMath) this.caption.style.display = "none";

			this.wrapper = document.createElement("div");
			this.wrapper.className = "chaos-wrapper";
			this.wrapper.append(this.canvas, this.caption);
		}
		return this.wrapper;
	},

	notificationReceived (notification) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.nextSim();
			// hiddenOnStartup or a pager may already have hidden us; resume() will start the loop
			if (!this.hidden) this.play();
		}
	},

	// Called by MagicMirror after the module's hide/show animation (MMM-pages uses hide/show).
	suspend () {
		this.pause();
	},

	resume () {
		// MMM-pages calls show() on every module of the current page at each rotation,
		// so only move on if we were actually stopped.
		if (this.running) return;
		this.nextSim(); // something different each time the page comes round
		this.play();
	},

	nextSim () {
		const names = this.config.simulations;
		const registry = window.ChaosSimulations || {};
		for (let tries = 0; tries < names.length; tries++) {
			this.simIndex = (this.simIndex + 1) % names.length;
			const Sim = registry[names[this.simIndex]];
			if (Sim) return this.useSim(Sim);
			Log.error(`[MMM-ChaosTheory] unknown simulation: ${names[this.simIndex]}`);
		}
	},

	useSim (Sim) {
		// sims pick their own options out of the module config
		this.sim = new Sim({ ...this.config, file: (f) => this.file(f) });
		this.startedAt = performance.now();
		this.lastReadout = 0;
		const info = Sim.info || {};
		this.titleEl.innerHTML = info.title ? `${info.title}<span class="chaos-subtitle">${info.subtitle || ""}</span>` : "";
		this.mathEl.innerHTML = (info.equations || []).map((l) => `<div>${l}</div>`).join("");
		this.readoutEl.innerHTML = this.readoutHtml = "";
		// clear whatever the previous simulation left behind
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	},

	play () {
		if (this.running || !this.canvas || !this.sim) return;
		this.running = true;
		this.lastFrame = performance.now();
		this.schedule();
	},

	pause () {
		this.running = false;
		clearTimeout(this.timer);
		cancelAnimationFrame(this.rafId);
		this.timer = this.rafId = null;
	},

	schedule () {
		if (!this.running) return;
		const interval = 1000 / this.config.fps;
		if (this.config.loop === "raf") {
			this.rafId = requestAnimationFrame((now) => {
				if (now - this.lastFrame < interval - 2) return this.schedule();
				this.frame(now);
				this.schedule();
			});
			return;
		}
		// Sleep until the next frame is due and only then ask for an animation frame,
		// so Chromium isn't woken at 60 Hz for frames we'd throw away. A sim that is
		// resting (e.g. finished drawing a static picture) is polled slowly instead.
		const wait = this.sim.resting ? 500 : Math.max(0, interval - (performance.now() - this.lastFrame));
		this.timer = setTimeout(() => {
			this.timer = null;
			this.rafId = requestAnimationFrame((now) => {
				this.rafId = null;
				this.frame(now);
				this.schedule();
			});
		}, wait);
	},

	frame (now) {
		if (now - this.startedAt > this.config.cycleSeconds * 1000) this.nextSim();
		const sim = this.sim;
		// clamp dt so a stalled frame doesn't explode an integrator; a resting sim is only
		// polled every 500 ms and integrates nothing, so let its clock keep real time
		const dt = Math.min(now - this.lastFrame, sim.resting ? 1000 : 100) / 1000;
		this.lastFrame = now;
		sim.step(dt);
		if (!sim.resting) sim.draw(this.ctx, this.canvas.width, this.canvas.height);

		// DOM text is re-laid-out and re-rasterised on change, so update it only twice a second
		if (this.config.showMath && sim.readout && now - this.lastReadout > 500) {
			this.lastReadout = now;
			const html = sim.readout(); // simulations build this themselves from numbers
			if (html !== this.readoutHtml) this.readoutEl.innerHTML = this.readoutHtml = html;
		}
	}
});
