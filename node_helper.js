/* Server side of MMM-ChaosTheory: samples what the mirror costs, for the stats panel.
 * Reads /proc and the thermal sensor (Linux only; elsewhere it reports what it can).
 * Samples only between CHAOS_STATS_START and CHAOS_STATS_STOP, i.e. while the module is shown.
 */
const NodeHelper = require("node_helper");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

let HZ = 100;
try { HZ = Number(execFileSync("getconf", ["CLK_TCK"]).toString()) || 100; } catch (e) { /* not Linux */ }

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
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "CHAOS_STATS_START") {
			if (this.timer) return;
			this.interval = (payload && payload.interval) || 2000;
			this.prev = null;
			this.sample();
			this.timer = setInterval(() => this.sample(), this.interval);
		} else if (notification === "CHAOS_STATS_STOP") {
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
