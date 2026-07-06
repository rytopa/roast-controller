# Roast Controller

A single-page, **Web Bluetooth** controller for **Hamid / Matchbox (TC4-class)** coffee roasters. Connect straight from your browser — no vendor app, no account, no cloud required.

It talks to the roaster over the open **TC4 / Artisan "Matchbox" serial protocol** (ASCII commands over a BLE UART), so it fully replaces the stock app's roasting screen.

> ⚠️ **Safety:** This drives a real heating element. Controls are locked until you explicitly enable them. Keep the fan running, never leave a roast unattended, and use **HEATER OFF** if anything looks wrong. Use at your own risk.

## Features

- **Live telemetry** — Bean (BT) and Exhaust (ET) temperature, Rate of Rise (RoR), heater %, fan %, and target setpoint.
- **Live chart** — BT, ET, and target (SV) plotted over time with roast-event markers and the planned profile curve.
- **PID setpoint control** — set or ramp a target temperature; the app engages the roaster's PID mode and holds it there.
- **Profile designer** — build a roast curve as points (time → target °C, optional fan %), name and save it, then run it: the app ramps the setpoint smoothly along the curve so the bean tracks it without big overshoot.
- **Roast session** — Charge / Dry End / First Crack / Drop markers, roast timer, and development-time %.
- **Data** — save roasts and profiles locally (in the browser), reload past roasts to review, and export any roast to CSV.
- **Manual controls** — fan, direct heater power, and PID on/off in an advanced section.

## Requirements

- **Chrome or Edge** on **Android, Windows, macOS, Linux, or ChromeOS**, with Bluetooth on.
- **Web Bluetooth requires HTTPS** (or `localhost`) — this is why it's hosted rather than opened as a local file, and why **iOS Safari is not supported** (use an Android phone or a desktop, or a Web-Bluetooth-capable iOS browser).
- A roaster whose BLE module advertises as **`MATCHBOX`** or **`MBOX`**.

## Usage

1. Open the hosted page in Chrome, near the powered-on roaster.
2. **Connect roaster** → pick your device.
3. Tick **Enable control** to unlock the controls.
4. Start the **fan** (the heater won't fire without airflow).
5. Either set a **Target °C**, start a **Ramp**, or **Run** a saved **profile**.
6. Use **Charge / Dry End / First Crack / Drop** to mark the roast; **Save this roast** or **Download CSV** when done.

If the app can't find the read/write channel, use **nRF Connect** to read the roaster's Service UUID and paste it into the advanced connection field.

## The protocol (for the curious)

All roaster comms are plain ASCII lines over BLE. Outbound commands:

| Command | Effect |
|---|---|
| `OT1,<0-100>` | heater duty % (manual / PID off) |
| `IO3,<0-100>` | fan / air % |
| `PID,ON` / `PID,OFF` | enable / disable closed-loop PID mode |
| `PID,SV,<temp>` | set PID target temperature |

Inbound telemetry is a comma-separated line — `ET, BT, heater%, fan%` — streamed continuously. RoR and roast-phase markers are computed/recorded client-side. PID gains live in the roaster's firmware and aren't adjustable over Bluetooth; ramping the setpoint is how you control overshoot.

## Hosting

It's a single static `index.html` — host it anywhere that serves HTTPS:

- **GitHub Pages:** put `index.html` in a public repo → *Settings → Pages → Deploy from a branch → main → /(root)*.
- Or drag it onto **Netlify Drop** / **Cloudflare Pages** for an instant HTTPS URL.

## Data & privacy

Profiles and roast logs are stored in your **browser's local storage** on the device you use — nothing leaves your machine. Storage is per-site, so saves live with the hosted URL.

## Roadmap

- Cloud sync of profiles and roast logs across devices (optional login).
- Rate-of-rise plotted on the chart, °F units, and importing reference curves.

## Disclaimer

Independent, unofficial software, not affiliated with the roaster manufacturer. Provided as-is with no warranty. You are responsible for safe operation of your equipment.

## License

MIT
