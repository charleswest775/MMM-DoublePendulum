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
		statsPanel: false, // what the mirror is spending: fps, CPU (Electron, cage, each core), temperature
		debugStats: false  // show achieved fps and frame timings in the corner of the screen
	},

	getScripts () {
		return [
			"simulations/common.js",
			"simulations/double-pendulum.js",
			"simulations/pendulums.js",
			"simulations/lorenz.js",
			"simulations/magnetic-pendulum.js",
			"simulations/logistic.js",
			"simulations/icons.js",
			"data/elements.js",
			"data/element-history.js",
			"simulations/atom.js",
			"simulations/zoom-math.js",
			"simulations/zoom.js",
			"simulations/photos.js",
			"simulations/sacred-geometry.js",
			"simulations/sacred.js"
		].map((f) => this.file(f));
	},

	getStyles () {
		return ["MMM-ChaosTheory.css"];
	},

	start () {
		this.canvas = null;
		this.sim = null;
		this.simIndex = -1;
		this.timer = null;   // pending setTimeout
		this.rafId = null;   // pending requestAnimationFrame
		this.running = false;
		this.prepared = false; // the next simulation is ready, chosen while we were hidden
		this.primer = null;    // pending attempt to draw it
		this.lastFrame = 0;
		this.startedAt = 0;
		this.lastReadout = 0;
		this.stats = this.config.debugStats ? this.startStats() : null;
		this.framesSinceStats = 0;
		this.lastStatsAt = performance.now();
	},

	getDom () {
		// Build once; MagicMirror may call getDom again on updateDom.
		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			this.canvas.className = "chaos-canvas";
			this.canvas.width = this.config.width;
			this.canvas.height = this.config.height;
			this.ctx = this.canvas.getContext("2d", { alpha: false });

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
			if (this.config.statsPanel) {
				this.panel = document.createElement("div");
				this.panel.className = "chaos-stats";
				this.panel.style.width = `${this.config.width}px`;
				this.wrapper.append(this.panel);
			}
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
		if (!this.running) return;
		this.pause();
		// resume() comes only after the fade-in, so anything left on the canvas would be what
		// the page fades in on, for half a second, before the new picture replaces it. Clear it
		// here instead, while we are invisible.
		this.clear();
		// Better still, if the next picture can be prepared cheaply while hidden (a photo: it
		// has to be loaded anyway, and then costs nothing to hold), switch to it now and draw
		// it, so the page fades in on the new picture. Not for the simulations, which would
		// then animate — or, in zoom's case, run its workers — with nobody looking.
		const Next = this.peek();
		if (Next && Next.preloadWhileHidden) {
			this.nextSim();
			this.prepared = true;
			this.prime();
		}
	},

	resume () {
		// MMM-pages calls show() on every module of the current page at each rotation,
		// so only move on if we were actually stopped.
		if (this.running) return;
		if (!this.prepared) this.nextSim(); // something different each time the page comes round
		this.prepared = false;
		this.play();
	},

	// what nextSim() would show next, without moving on
	peek () {
		const names = this.config.simulations;
		return (window.ChaosSimulations || {})[names[(this.simIndex + 1) % names.length]];
	},

	// Draw the prepared picture while hidden, once it has something to draw (a photo has to
	// load first), then leave it there. Gives up after 10 s: the page may never come back.
	prime (tries = 40) {
		if (this.running || !this.sim) return;
		this.sim.step(0);
		this.sim.draw(this.ctx, this.canvas.width, this.canvas.height);
		if (!this.sim.resting && tries > 0) this.primer = setTimeout(() => this.prime(tries - 1), 250);
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
		if (this.sim && this.sim.dispose) this.sim.dispose(); // e.g. zoom's workers
		// sims pick their own options out of the module config
		this.sim = new Sim({ ...this.config, file: (f) => this.file(f) });
		this.startedAt = performance.now();
		this.lastReadout = 0;
		const info = this.sim.info || Sim.info || {}; // per instance where the caption depends on it (atom)
		this.titleEl.innerHTML = info.title ? `${info.title}<span class="chaos-subtitle">${info.subtitle || ""}</span>` : "";
		this.mathEl.innerHTML = (info.equations || []).map((l) => `<div>${l}</div>`).join("");
		this.readoutEl.innerHTML = this.readoutHtml = "";
		this.clearCanvas(); // whatever the previous simulation left behind
	},

	// nothing of the last simulation left: neither its picture nor its words
	clear () {
		this.clearCanvas();
		this.titleEl.innerHTML = this.mathEl.innerHTML = "";
		this.readoutEl.innerHTML = this.readoutHtml = "";
	},

	clearCanvas () {
		this.ctx.globalAlpha = 1;
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	},

	play () {
		if (this.running || !this.canvas || !this.sim) return;
		this.running = true;
		clearTimeout(this.primer);
		this.startedAt = performance.now(); // cycleSeconds counts time on screen
		if (this.panel) this.sendSocketNotification("CHAOS_STATS_START", { interval: 2000, id: this.identifier });
		this.lastFrame = performance.now();
		this.schedule();
	},

	pause () {
		if (this.running && this.panel) this.sendSocketNotification("CHAOS_STATS_STOP", { id: this.identifier });
		this.running = false;
		clearTimeout(this.timer);
		clearTimeout(this.primer);
		cancelAnimationFrame(this.rafId);
		this.timer = this.rafId = null;
	},

	schedule () {
		if (!this.running) return;
		const interval = 1000 / this.config.fps;
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
		const t0 = performance.now();
		sim.step(dt);
		const t1 = performance.now();
		if (!sim.resting) {
			sim.draw(this.ctx, this.canvas.width, this.canvas.height);
			this.framesSinceStats++;
		}
		if (this.stats) this.stats.frame(t1 - t0, performance.now() - t1);

		// DOM text is re-laid-out and re-rasterised on change, so update it only twice a second
		if (this.config.showMath && sim.readout && now - this.lastReadout > 500) {
			this.lastReadout = now;
			const html = sim.readout(); // simulations build this themselves from numbers
			if (this.stats && this.stats.el.textContent !== this.stats.text) this.stats.el.textContent = this.stats.text;
			if (html !== this.readoutHtml) this.readoutEl.innerHTML = this.readoutHtml = html;
		}
	},

	socketNotificationReceived (notification, stats) {
		if (notification === "CHAOS_STATS" && this.panel && this.running) this.renderPanel(stats);
	},

	// One line, refreshed every 2 s by the node_helper: frames drawn, CPU as % of one core
	// (the Pi has four), a bar per core, temperature, and where we are in the cycle.
	renderPanel (st) {
		const now = performance.now();
		const fps = (this.framesSinceStats * 1000) / (now - this.lastStatsAt);
		this.framesSinceStats = 0;
		this.lastStatsAt = now;
		const names = this.config.simulations, i = this.simIndex;
		const left = Math.max(0, Math.round(this.config.cycleSeconds - (now - this.startedAt) / 1000));
		const cycle = `${names[i]} ${i + 1}/${names.length} · next in ${left} s`;
		if (st.unsupported) {
			this.panel.innerHTML = `<b>${fps.toFixed(1)}</b> fps · ${cycle}`;
			return;
		}
		const pi = st.cores.reduce((a, b) => a + b, 0) / st.cores.length;
		const bars = st.cores.map((c) => `<span class="bar"><span style="height:${Math.min(100, c).toFixed(0)}%"></span></span>`).join("");
		const hot = st.temp >= 70 ? "hot" : st.temp >= 60 ? "warm" : "cool";
		this.panel.innerHTML =
			`<b>${fps.toFixed(1)}</b> fps` +
			`<span class="sep">·</span>Electron <b>${st.electron.toFixed(0)}%</b> cage <b>${st.cage.toFixed(0)}%</b> <span class="dim">of a core</span>` +
			`<span class="sep">·</span>Pi <b>${pi.toFixed(0)}%</b> ${bars}` +
			(st.temp ? `<span class="sep">·</span><b class="${hot}">${st.temp.toFixed(1)} °C</b>` : "") +
			`<span class="sep">·</span><span class="dim">${cycle}</span>`;
	},

	// debugStats: frames drawn per second, JS time in step/draw, and Chromium's long animation
	// frames (which include style, layout and paint work on the main thread, not just JS)
	startStats () {
		const s = { n: 0, step: 0, draw: 0, loaf: [], text: "measuring…" };
		s.el = document.createElement("div");
		s.el.style.cssText = "position:fixed;left:8px;bottom:4px;font:14px monospace;color:#8f8;z-index:9999";
		document.body.append(s.el);
		s.frame = (a, b) => { s.n++; s.step += a; s.draw += b; };
		try {
			new PerformanceObserver((list) => { for (const e of list.getEntries()) s.loaf.push(e); })
				.observe({ type: "long-animation-frame", buffered: false });
		} catch (e) { s.noLoaf = true; }
		setInterval(() => {
			const secs = 5, n = Math.max(1, s.n);
			const long = s.loaf.length, longMs = s.loaf.reduce((t, e) => t + e.duration, 0);
			const render = s.loaf.reduce((t, e) => t + (e.startTime + e.duration - (e.renderStart || e.startTime + e.duration)), 0);
			s.text = `${(s.n / secs).toFixed(1)} fps · step ${(s.step / n).toFixed(1)} ms · draw ${(s.draw / n).toFixed(1)} ms · ` +
				(s.noLoaf ? "no LoAF" : `${long} frames > 50 ms (avg ${(longMs / Math.max(1, long)).toFixed(0)} ms, ${(render / Math.max(1, long)).toFixed(0)} ms render)`);
			s.n = s.step = s.draw = 0; s.loaf = [];
		}, 5000);
		return s;
	}
});
