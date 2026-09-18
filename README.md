# MMM-ChaosTheory

A [MagicMirror²](https://magicmirror.builders/) module that draws chaos-theory simulations,
starting with a **double pendulum** leaving a fading trail. Every time its page comes round
it starts a fresh run with new initial conditions, so it never looks the same twice.

Built to run on a **Raspberry Pi 3 without GPU acceleration**: frame-rate capped, cheap
drawing, and the animation stops completely while the module is hidden.

> Status: early. The double pendulum works; more simulations are planned.

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/charleswest775/MMM-ChaosTheory
```

No npm dependencies.

## Config

```js
{
	module: "MMM-ChaosTheory",
	position: "middle_center",
	config: {
		simulation: "doublePendulum",
		width: 900,
		height: 900,
		fps: 30,
		resetSeconds: 60,
		color: "#ffffff"
	}
}
```

| Option | Default | Description |
|---|---|---|
| `simulation` | `"doublePendulum"` | Which simulation to show |
| `width`, `height` | `900` | Canvas size in pixels. Larger costs more CPU on a Pi |
| `fps` | `30` | Frame-rate cap. Lower uses less CPU |
| `resetSeconds` | `60` | Start a new run this often (also restarts whenever the module is shown) |
| `color` | `"#ffffff"` | Drawing colour |

## Development

```bash
npm test     # physics checks (node --test, no dependencies)
```

## License

MIT
