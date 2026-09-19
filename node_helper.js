/* Server side of MMM-ChaosTheory: serves the photo page's pictures, and samples what the
 * mirror costs, for the stats panel.
 * Reads /proc and the thermal sensor (Linux only; elsewhere it reports what it can).
 * Samples only between CHAOS_STATS_START and CHAOS_STATS_STOP, i.e. while the module is shown.
 * With several instances (say one per MMM-pages page) one may start before the last has
 * stopped, so sampling ends only when every instance that started it has stopped.
 */
const NodeHelper = require("node_helper");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { listPhotos } = require("./photo-index.js");

// where mac/sync-mirror-photos.sh (in the mirror's setup repo) puts the resized photos
const PHOTO_DIR = process.env.MIRROR_PHOTOS || path.join(os.homedir(), "mirror-photos");

let HZ = 100;
// stderr ignored: by default execFileSync relays it to ours, and under pm2 that write fails
// (EFAULT) asynchronously, past the try
try { HZ = Number(execFileSync("getconf", ["CLK_TCK"], { stdio: ["ignore", "pipe", "ignore"] }).toString()) || 100; } catch (e) { /* not Linux */ }

const read = (f) => { try { return fs.readFileSync(f, "utf8"); } catch (e) { return null; } };

// utime + stime (clock ticks) of a process; fields after the ")" that closes the command name
const ticksOf = (pid) => {
	const stat = read(`/proc/${pid}/stat`);
	if (!stat) return 0;
	const f = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
	return Number(f[11]) + Number(f[12]);
};

// busy and total ticks per core, from /proc/stat
const coreTicks = () => (read("/proc/stat") || "").split("\n").filter((l) => /^cpu\d/.test(l)).map((l) => {
	const v = l.split(/\s+/).slice(1).map(Number);
	const idle = v[3] + (v[4] || 0);
	const total = v.reduce((a, b) => a + b, 0);
	return { busy: total - idle, total };
});

module.exports = NodeHelper.create({
	start () {
		this.timer = null;
		this.watchers = new Set();
		// the photos page: the list (re-read each time, so newly synced photos turn up), then
		// each file. CORS on the list lets dev/preview.html on the Mac show the Pi's photos.
		this.expressApp.get("/MMM-ChaosTheory/photos/", (req, res) => {
			res.set("Access-Control-Allow-Origin", "*").json(listPhotos(PHOTO_DIR));
		});
		this.expressApp.get("/MMM-ChaosTheory/photos/:name", (req, res) => {
			const name = path.basename(req.params.name); // nothing outside the folder
			res.sendFile(path.join(PHOTO_DIR, name), { maxAge: "1d" }, (err) => err && !res.headersSent && res.sendStatus(404));
		});
	},

	socketNotificationReceived (notification, payload) {
		const id = (payload && payload.id) || "";
		if (notification === "CHAOS_STATS_START") {
			this.watchers.add(id);
			if (this.timer) return;
			this.interval = (payload && payload.interval) || 2000;
			this.prev = null;
			this.sample();
			this.timer = setInterval(() => this.sample(), this.interval);
		} else if (notification === "CHAOS_STATS_STOP") {
			this.watchers.delete(id);
			if (this.watchers.size) return;
			clearInterval(this.timer);
			this.timer = null;
		}
	},

	// the Electron processes (MagicMirror's window and its helpers) and the cage compositor;
	// the process list is re-scanned every 30 s, since Chromium starts and ends helpers
	pids () {
		const now = Date.now();
		if (this.pidCache && now - this.pidCache.at < 30000) return this.pidCache;
		const electron = [], cage = [];
		for (const pid of fs.readdirSync("/proc").filter((d) => /^\d+$/.test(d))) {
			const cmd = read(`/proc/${pid}/cmdline`);
			if (!cmd) continue;
			if (cmd.includes("electron/dist/electron")) electron.push(pid);
			else if ((read(`/proc/${pid}/comm`) || "").trim() === "cage") cage.push(pid);
		}
		this.pidCache = { at: now, electron, cage };
		return this.pidCache;
	},

	sample () {
		if (!fs.existsSync("/proc/stat")) return this.sendSocketNotification("CHAOS_STATS", { unsupported: true });
		const { electron, cage } = this.pids();
		const cur = {
			at: process.hrtime.bigint(),
			electron: electron.reduce((t, p) => t + ticksOf(p), 0),
			cage: cage.reduce((t, p) => t + ticksOf(p), 0),
			cores: coreTicks()
		};
		const temp = Number(read("/sys/class/thermal/thermal_zone0/temp")) / 1000 || null;
		const prev = this.prev;
		this.prev = cur;
		if (!prev) return;
		const secs = Number(cur.at - prev.at) / 1e9;
		const pct = (a, b) => Math.max(0, ((a - b) / HZ / secs) * 100);
		this.sendSocketNotification("CHAOS_STATS", {
			electron: pct(cur.electron, prev.electron),
			cage: pct(cur.cage, prev.cage),
			cores: cur.cores.map((c, i) => {
				const p = prev.cores[i] || c, dt = c.total - p.total;
				return dt > 0 ? ((c.busy - p.busy) / dt) * 100 : 0;
			}),
			temp
		});
	},

	stop () {
		clearInterval(this.timer);
	}
});
