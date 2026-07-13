# Roast Controller

A single-page, **Web Bluetooth** controller for **Hamid / Matchbox (TC4-class)** coffee roasters. Connect straight from your browser — no vendor app, no account, no cloud required.

It talks to the roaster over the open **TC4 / Artisan "Matchbox" serial protocol** (ASCII commands over a BLE UART), so it fully replaces the stock app's roasting screen.

> ⚠️ **Safety:** This drives a real heating element. Controls are locked until you explicitly enable them. Keep the fan running, never leave a roast unattended, and use **HEATER OFF** if anything looks wrong. Use at your own risk.

## Features

- **Live telemetry** — Bean (BT) and Exhaust (ET) temperature, Rate of Rise (RoR), heater %, fan %, and target setpoint.
- **Live chart** — BT, ET, and target (SV) plotted over time, plus heater-power and fan traces on a secondary % axis so you can see the PID working, with roast-event markers. Loading a profile previews its curve **and its planned RoR** on the chart, and the actual bean RoR is plotted live (0–30 °C/min scale) so you can compare against the plan.
- **PID setpoint control** — set or ramp a target temperature; the app engages the roaster's PID mode and holds it there. All Bluetooth commands are queued (one write in flight at a time) and the profile's fan setting is verified against telemetry and re-sent if the roaster missed it.
- **Safe endings** — when a running profile reaches its last point the heater switches off automatically (with an alert); pressing **Drop** turns the heater off too, leaving the fan at its current speed.
- **Profile designer** — build a roast curve **directly on a graph**: drag points to shape it, press empty space to add a point, double-tap to delete, with the implied RoR of each segment shown as you edit. A **phase bar** shows the Dry / Maillard / Development split (% and duration) from your editable DE/FC temperatures, updating live. Fine-tune times/temps and optional fan % in the point table, name and save it, then run it: the app ramps the setpoint smoothly along the curve so the bean tracks it without big overshoot.
- **Between-batch protocol** — one button between roasts: blasts the fan (heater off) to cool the machine to a set temp, then ramps gradually to your charge temp over 1 minute at a low fan speed, holds it for 30 s, and lights up **DROP BEANS** (with a beep/vibration) when it's stable.
- **Auto-charge** — when the beans go in, the app detects the BT plunge, marks Charge, and starts the selected profile automatically.
- **Charge soak** — a profile started at Charge begins open-loop: heater fixed at **30% until 0:30**, then **40% until 0:45** on the roast clock, after which the PID takes over and follows the curve. (A profile started without a recent Charge — e.g. restarted mid-roast — engages the PID immediately.)
- **Beans not agitating? Shift the air curve** — bump the fan by hand (fan row under the chart); that pauses the automated fan, and one press of **Resume — shift curve to my fan** offsets the whole air profile through your adjusted speed for the rest of the roast, keeping its shape (works with auto-fan, per-point fan, and the ET-track fan replay).
- **Roast session** — Charge / Dry End / First Crack / Drop markers, roast timer, and development-time %. At Drop, a **roast summary card** (phase times/%, drop & max BT, weight loss, **average heater % + heat load + energy used**) is shown and stored with the log entry. Enter your heater's wattage to get a **kWh estimate** per roast.
- **Background curve** — overlay any saved roast as ghost curves aligned at Charge and roast to match it, with a live **BT delta vs background** readout.
- **ET-track roast (experimental)** — replay a captured roast by its **exhaust temp**: the app runs the heater directly in manual mode with a software PID (feedforward from the reference roast's recorded heater % + trim on the ET error), replaying its fan curve too. The run ends (heater off) when the **bean temp reaches the reference's drop temperature** (editable "Drop at BT"), not on the reference's clock — a slower batch keeps going, holding the final ET, until the beans arrive (2-min safety cap). A smoothing option cleans the captured ET line before it becomes the target. Watchdog (stale telemetry ⇒ heater cut), temperature ceiling, and all existing stop paths (HEATER OFF, Drop, disconnect) apply. ⚠️ Manual-mode heat — stay at the machine.
- **Live guidance** — a live Dry/Maillard/Dev phase bar, a dotted **BT projection** (60 s look-ahead at current RoR), an **FC countdown**, a settable BT alert, and automatic **RoR crash / flick warnings**. The RoR trace has an adjustable **window** (responsiveness) and **smoothing** (a moving average that cleans the jaggedness from the roaster's ~1 °C telemetry steps).
- **Data** — every roast is **auto-saved to the log at Drop** with a date/time stamp (the saved-roasts list shows them for easy retrieval), plus manual save/rename. Enter **bean details and green/roasted weights** in the Roast session panel — weight-loss % is computed, stored with the roast (even if typed in after the drop), and included in the CSV export.
- **Green inventory** — track your green coffee stock: add beans by hand or **photograph the bag/spec label** and OCR (Tesseract.js, in-browser, **English + Chinese**) pre-fills the name, origin, and bag weight, and parses common spec fields (variety, region, grade, altitude, density, moisture, process, suggested roast, cupping notes) into a tidy Notes block. Pick the bean in the Roast session panel and the batch's **green weight is deducted from stock automatically at Drop** (correcting the weight afterwards adjusts it; switching the bean moves it). Out-of-stock beans are flagged, and the inventory syncs with Cloud sync like profiles and logs (if you set up sync before this feature existed, re-paste the updated `sync-worker.js` into your Worker).
- **Manual controls** — fan, direct heater power, and PID on/off in an advanced section.
- **Fan override during a roast** — adjust the fan by hand at any time (quick buttons, ±5 nudges, or a set value); doing so pauses the profile's fan commands for the rest of the roast while the PID temperature curve keeps running, with a one-tap "Resume profile fan" to hand it back.
- **Day / night mode** — ☀️/🌙 toggle in the header; charts re-render with a matching palette and the choice is remembered.

## Requirements

- **Chrome or Edge** on **Android, Windows, macOS, Linux, or ChromeOS**, with Bluetooth on.
- **Web Bluetooth requires HTTPS** (or `localhost`) — this is why it's hosted rather than opened as a local file, and why **iOS Safari is not supported** (use an Android phone or a desktop, or a Web-Bluetooth-capable iOS browser).
- A roaster whose BLE module advertises as **`MATCHBOX`** or **`MBOX`**.

## Usage

1. Open the hosted page in Chrome, near the powered-on roaster.
2. **Connect roaster** → pick your device.
3. Tick **Enable control** to unlock the controls.
4. Start the **fan** (the heater won't fire without airflow).
5. Either set a **Target °C**, start a **Ramp**, or **Run** a saved **profile**. For the hands-free flow: load a profile, press **Start between-batch cycle**, and pour the beans in when **DROP BEANS** lights up — with **Auto-charge** on, the profile starts by itself (no need to press Run profile).
6. Use **Charge / Dry End / First Crack / Drop** to mark the roast; **Save this roast** or **Download CSV** when done.

If the app can't find the read/write channel, use **nRF Connect** to read the roaster's Service UUID and paste it into the advanced connection field.

## AI-generated profiles (JSON import)

You can have an AI assistant (e.g. Claude) design a roast curve and load it straight into the profile designer — use **Import JSON** / **Export JSON** in the Profile designer panel. The file format:

```json
{
  "format": "roast-profile-v1",
  "name": "Espresso — slow approach, 216 EOR",
  "notes": "Push FC back, extend development, roast darker. Deltas +25/+23/+21/+18/+15/+11/+8/+5 — a longer, gentler decline than the filter curve, no rising-RoR tricks. Drop at 216 °C EOR.",
  "points": [
    { "time": "0:00", "targetC": 90,  "fanPct": 60 },
    { "time": "1:00", "targetC": 115, "fanPct": 60 },
    { "time": "2:00", "targetC": 138, "fanPct": 57 },
    { "time": "3:00", "targetC": 159, "fanPct": 53 },
    { "time": "4:00", "targetC": 177, "fanPct": 49 },
    { "time": "5:00", "targetC": 192, "fanPct": 45 },
    { "time": "6:00", "targetC": 203, "fanPct": 42 },
    { "time": "7:00", "targetC": 211, "fanPct": 40 },
    { "time": "8:00", "targetC": 216, "fanPct": 39 }
  ]
}
```

- `time` — minutes:seconds from Charge (also accepts plain seconds, `8'0`, or `8m`).
- `targetC` — PID target in °C (clamped to 0–260).
- `fanPct` — optional fan 0–100; omit it to keep the fan under manual control.
- `autoFan` — optional `{ "startPct": 60, "endPct": 42, "mode": "knee" }`: bean-temp-driven fan schedule declining from the start speed to the end speed, shaped by `mode` (`knee` gentle-then-faster around 160 °C · `hold` flat then straight down · `linear` even decline · `steps` at the DE/FC temps). Overrides per-point `fanPct` while running. (Legacy `dropPct` is still accepted.)
- `notes` — optional short write-up of the profile (intent, bean/batch, RoR deltas, drop target). Shown in the designer's Notes box and kept with the saved profile.
- At least 2 points; they're sorted by time on import. Import fills the designer — review the curve and notes, then **Save profile**.

Example prompt: *"Design a roast profile for [beans / batch size / roast level] as a minute-by-minute table of target bean temperature (°C) and fan %. Include a short write-up of what the curve is doing in the `notes` field. Output it as a downloadable JSON file in this format: …"* (paste the JSON above as the template).

For a complete, paste-into-Claude spec — field semantics, how the app interpolates the curve, and machine-specific design guidance — see **[PROFILE_FORMAT.md](PROFILE_FORMAT.md)**.

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

Profiles and roast logs are stored in your **browser's local storage** on the device you use — nothing leaves your machine unless you enable **Cloud sync** (below). Storage is per-site, so saves live with the hosted URL.

## Cloud sync (optional)

Sync your **profiles and roast logs across devices** (iPad, phone, computer) through a free **Cloudflare Worker + KV** store that you own — no accounts, no third-party service holding your data. Devices that share a private **sync code** see the same data; changes merge automatically (newer edit wins per record, deletions propagate).

**Setup, in short:** create a free Cloudflare Worker from [`sync-worker.js`](sync-worker.js) with a KV namespace bound as `SYNC`, then in the app's **Cloud sync** panel paste the Worker URL, **Generate** a code, **Connect**, and enter the same code on your other devices. Syncing is then automatic (debounced push on change, pull every 45 s and on tab focus).

📖 **Full click-by-click walkthrough, verification, and troubleshooting → [CLOUD_SYNC.md](CLOUD_SYNC.md).**

> ⚠️ The sync code is both the address and the password — **anyone with it can read and write your data**, so keep it private. Data travels over HTTPS to your own Worker.

## Roadmap

- °F units and importing reference curves.
- Optional login / named devices for cloud sync.

## Disclaimer

Independent, unofficial software, not affiliated with the roaster manufacturer. Provided as-is with no warranty. You are responsible for safe operation of your equipment.

## License

MIT
