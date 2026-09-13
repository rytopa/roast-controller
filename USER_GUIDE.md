# Roast Controller — new user guide

A step-by-step walkthrough for your first roasts with the Roast Controller web app and a **Hamid / Matchbox (TC4-class)** roaster. It covers setup, the everyday roasting loop, building profiles, and what to do after the roast. Feature-by-feature reference lives in the [README](README.md); this guide is about *the order you do things in*.

> ⚠️ **Read this first.** The app drives a real heating element. Controls stay locked until you tick **Enable control**. Keep the fan running whenever the heater is on, never leave a roast unattended, and press **Stop / Drop** (the red button on the Controls rail) if anything looks wrong — it always works, whatever else is running.

---

## 1. Before you start

**You need**

- **Chrome or Edge** on Android, Windows, macOS, Linux, or ChromeOS with Bluetooth switched on. iOS Safari does not support Web Bluetooth, so an iPhone/iPad will not work (a desktop or Android phone/tablet is the usual choice).
- The app opened over **HTTPS** (the hosted link you were given). Opening the file from disk will not work because Web Bluetooth needs a secure page.
- A roaster whose Bluetooth module advertises as **MATCHBOX** or **MBOX**, powered on and within a few metres.
- Green coffee, a scale, and somewhere ventilated to roast.

**Good to know**

- Everything you save (profiles, roast logs, inventory, settings) is stored in **this browser on this device**. Nothing leaves your machine unless you switch on Cloud sync (section 9).
- The ☀️/🌙 button in the header switches day/night mode. The choice is remembered.
- The page is one long column of panels. The order below follows the panels from top to bottom.

---

## 2. First-time setup (5 minutes)

1. Power the roaster on. Close the vendor app if it is open — only one thing can hold the Bluetooth connection.
2. Open the app and press **Connect roaster** in the **Connection** panel. A browser dialog lists nearby devices; pick `MATCHBOX` / `MBOX`. If it is not listed, tick **Can't find it by name? List all Bluetooth devices** and try again.
3. The status pill turns to **connected** and the **Live** tiles start showing **Bean °C**, **ET °C**, **Heater %** and **Fan %**. If the numbers appear, the link is working.
4. Tick **Enable control** (just under the chart). Until this is ticked the app only *reads* from the roaster.
5. Test the fan: tap **Fan +** on the **Controls** rail a few times. You should hear the roaster's fan change speed and see the Fan value climb. This confirms commands are reaching the machine.

If the tiles stay at `—` after connecting, open **Connection details / advanced** and follow the troubleshooting notes in section 12.

---

## 3. Your first roast — the simplest path

The app can run the *whole* roast for you from a single button. For the first roast, use a ready-made profile so you can learn the screen without designing a curve.

**A. Load a profile**

1. Download one of the ready-made curves from the repo's [`profiles/`](profiles/) folder — `sprint-140-filter-208.json` is a good all-round filter roast for ~150 g.
2. In the **Profile designer** panel press **Import JSON** and choose the file. The curve appears on the graph, with the name and notes filled in.
3. Press **Save profile**. It now appears in the profile drop-down for next time.
4. Tick **Auto fan** below the graph if it is not already on (the imported profile sets this). Leave the rest as is.

**B. Set the between-batch cycle**

In the **Between batches / charge** panel:

- **Cool to °C** — the machine is fanned down to this before charging (default 100).
- **Charge temp °C** — the drum temperature at which you drop beans in (default 180). Start with the default.
- **Charge fan %** — fan speed used while heating to charge and at the moment you pour (default 35).
- Leave **Charge soak** and **Auto-charge** ticked.
- The cycle always hands over to the profile (or an armed replay) at the bean drop. A hand-driven roast uses the separate **Manual roast** button instead — see section 6.

**C. Run the cycle**

1. Press **🔄 Start between-batch cycle**. A small dialog asks for the **bean** (pick one from inventory, or leave it untracked) and the **green weight** (150 g, 100 g, or a custom figure). Both are stored with the roast, and the green weight is taken out of that bean's stock at Drop. Press **▶ Start cycle**.
2. The app fans the machine down to the cool-to temperature, then ramps the heater up gently (at most 1.5% per second, capped at 85%) until the drum reaches the charge temperature, and holds it for 30 s. The roaster's PID is not used here, so there is no power surge; the first cycle after installing may take a minute or two longer to settle while the app learns the hold power, which it remembers for later cycles.
3. When the drum is stable the panel flashes **⬇ DROP BEANS NOW** and the device beeps/vibrates. Pour the beans in.
4. With **Auto-charge** on, the app sees the bean-probe plunge, marks **Charge**, starts the timer, and begins the profile. You do not need to press **▶ Run profile**.
5. For the first 45 s the heater runs at a fixed low power (the *charge soak*), then the PID takes over and follows your curve. The **profile clock** drop-down next to the soak settings decides where the curve starts: **runs from charge** (the curve's 0:00 is the charge, so the PID joins it at 0:45) or **starts after the soak** (the curve's 0:00 is the end of the soak, so the PID begins at your first point and the full curve plays after the soak).

**D. During the roast**

- Watch **Bean °C** climb and the **RoR** tile settle. The chart shows the plan as a dashed line and the actual bean temperature as a solid one.
- Press the green **DE** button on the Controls rail when the beans turn from green/yellow to tan (around 150–165 °C bean temp); it then becomes **FC**, which you press when you hear the first pops. These marks drive the phase bar and the development-time percentage.
- If the beans are not tumbling well, bump the fan with **Fan +** on the rail. This pauses the automated fan; **Resume profile fan** under the chart hands it back.

**E. Drop**

1. When the beans reach the colour you want, press **Stop / Drop** on the Controls rail. The heater goes to 0, the fan returns to the charge speed, the roast is stamped with a 3-character **batch code** (e.g. `#K7Q`) and is **saved automatically**. Recording stops but the finished curve stays on the chart so you can look it over — it clears when you press **Charge** for the next batch (or start the between-batch cycle / **Clear chart**). Write the code on the bag.
2. If you let the profile run to its last point instead, the heater switches off by itself and an alert sounds — you still press **Stop / Drop** to end and save the roast.
3. The saved roast appears at the top of the saved-roasts list in the **Data** panel, named by its batch code, time and bean. Type tasting notes there whenever you like.
4. Tip the beans out to cool and let the machine idle with the fan on before the next batch.

That is the whole loop. The next batch starts again at step C.

---

## 4. The everyday workflow at a glance

```
Connect → Enable control → pick profile → Start between-batch cycle
   → DROP BEANS NOW → (auto-charge) → mark Dry End / First Crack (once First Crack is marked, both FC buttons count development up from 0:00 with its % of the roast, and hold the final value at Drop)
   → Stop / Drop → notes / star → next batch
```

Between batches the app does the cooling and re-heating for you, so the rhythm is: *tip out, note, press Start cycle, wait for the light, pour*.

---

## 5. Building your own profile

Open the **Profile designer** panel. A profile is a target bean-temperature curve over time (from Charge), plus an optional fan schedule.

**Fastest: generate from phase targets**

1. Open **✨ Generate a curve from phase targets**.
2. Enter the temperature you want at 0:00, your **dry-end** temperature and how long drying should take, your **first-crack** temperature and how long the Maillard phase should take, and the **drop** temperature and development time.
3. Pick a **shape**. If unsure, start with **Declining RoR** (the classic). The others are explained in the panel text; **Sprint** and **Flat development** are popular next steps.
4. Optionally tick **⚡ Precharge** (extra push in the first 40 s) or **🍃 Coast** (finish 3 °C early on stored heat).
5. The curve loads into the graph with the name, notes and phase markers filled in. Flip between shapes to compare, then **Save profile**.

**Hands-on: draw on the graph**

- Press **🔒 Graph locked — tap to edit** to unlock. The graph starts locked every time the page opens; unlocking lasts for the visit only.
- Drag points to move them, press empty space to add a point, double-tap a point to delete it. The implied RoR of each segment is shown while you edit.
- The **phase bar** shows the Dry / Maillard / Development split from the **DE at** and **FC at** temperatures beside it — set those to match your beans.
- Fine-tune numbers in **Details — points table**.

**Fan**

- **Auto fan** (recommended): the fan follows the *measured* bean temperature, declining from the start % to the end %. Optional **mid** point lets you shape a rise-then-fall. This overrides any per-point fan values while running.
- Or fill the **Fan %** column per point for explicit control.
- Or leave both empty to run the fan by hand during the roast.

**Import / export**

- **Export JSON** saves the profile as a file you can share or hand to an AI assistant to tweak. **Import JSON** loads one. The format is documented in [PROFILE_FORMAT.md](PROFILE_FORMAT.md) — paste that file into Claude or another assistant to have it design a curve for a specific bean.

**Running a profile without the between-batch cycle**

Select it in the drop-down and press **▶ Run profile**. If no roast is in progress the app marks **Charge** for you at that moment — the previous roast leaves the chart, recording and the timer start, the DE / FC buttons come alive — and the PID engages on the curve immediately, from whatever state the machine is in. The between-batch and charge-soak settings do not apply to a hand-started run: a running cycle stops (keeping its heat) and the soak is skipped — those belong to the cycle's auto-charge. If a Charge is already active (a restart mid-roast) the curve simply starts from now. The same applies to a hand-started ET-track or power-schedule run.

---

## 6. Reading the screen during a roast

**Live tiles** — Bean (BT), Exhaust (ET), RoR (rate of rise in °C/min), Target (the setpoint the app is commanding), Heater %, Fan %. The **PID** pill shows whether the roaster's closed-loop mode is engaged.

**Chart** — top pane: temperatures on the left axis, RoR on the right (0–30 °C/min). Bottom pane: heater and fan %, with the dashed gold line showing cumulative heat. Dashed curves are the plan; faded curves are a background roast (section 7). Hover or drag on the chart to read values.

**Under the chart**

- The **Enable control** tick.
- When you have adjusted the fan by hand during a profile, the **Resume profile fan** and **Resume — shift curve to my fan** buttons appear here.
- **RoR window** and **RoR smooth** tune how responsive vs. how calm the RoR trace is.

**Control rail** (right of the chart on wide screens, below it on phones) — laid out like the stock app's side column: a **Target temp** tile and a **PID** tile, **Heater −/+** and **Fan −/+** steppers showing the live values, a green **event-tagging** button that tags **DE** then **FC**, and a red **Stop / Drop**. Both steppers move 1 % per tap; tap the **value** itself (the big number) to open a **−5 / +5** row under it for bigger steps, tap it again to close. The **Heater** and **Fan** label tiles are buttons too: tap one to switch that output **off** (Heater off takes manual control like Heater ±; Fan off asks you to confirm while the heater is still on). This is where you mark events, adjust the fan and end the roast. Heater ± takes **manual control**: it switches the PID off and stops any running profile or cycle (you are asked to confirm), then sets the heater directly. Stop ends the roast: heater off, fan back to the charge speed, roast saved.

**Manual roast** — the **Manual roast** panel (just above *Between batches / charge*) has one button: **🎛 Start manual roast**. Tap it when the beans go in: the app marks Charge, starts the timer, the chart recording and the batch code, then sets the fan and the heater to the **opening** values next to the button (60 % / 60 % by default, remembered) with the PID **off** and hands over. No between-batch cycle, no charge soak, no profile. From there you drive the roast with the Heater and Fan ± steppers on the Controls rail, tag DE and FC with the green button, and press Stop / Drop to end and save. Tapping it while a profile or cycle is running asks for confirmation, then takes over the roast the same way. Forgot to tag DE? In every mode (a profile run included), when the bean temperature reaches 180 °C with no Dry End mark, the app tags it for you at the moment BT crossed the DE temperature (160 °C by default) and the button moves on to FC. Your opening values are remembered.

**Live guidance** — a live phase bar, a dotted 60 s projection of where the bean temperature is heading, an FC countdown, and automatic **RoR crash / flick** warnings. If **Between batches** is running, that panel shows a status line and the DROP BEANS light.

**»DE / »FC prediction** — the two small tiles under the roast timer count down to the moment the bean temperature is expected to reach the **DE** and **FC** temperatures set in the Phases row, and name the predicted clock time (*»FC · at 7:40*). They show *--:--* until the turning point is confirmed and the beans are climbing, and switch to *DE reached 4:47* once the crossing happens. On the chart the dashed bean-temp projection runs out to the predicted First Crack, with hollow *DE ~4:44* / *FC ~7:39* markers on the DE and FC temperature lines. The projection uses the slope of the last 45 s bent by the falling RoR of the last 60 s (an exponential decay towards 1 °C/min), so it does not arrive too early the way a straight line would; expect it to settle within a few seconds from about three minutes in — early in the climb, while RoR is still finding its level, it is only a rough guide. The **Predict DE / FC** setting next to *RoR smooth* switches to a plain **linear** projection or turns the feature off (remembered). With a background roast loaded, the line under the tiles shows how far ahead or behind its DE / FC you are (*DE vs BG +0:12*).

**Fan override** — any manual fan change during a profile pauses the profile's fan (the temperature curve keeps running). **Resume profile fan** hands it back at the profile's values; **Resume — shift curve to my fan** hands it back but offsets the whole remaining fan curve through the speed you chose.

---

## 7. After the roast: data, notes, and comparing roasts

Everything in the **Data** panel.

- Roasts are **saved automatically at Drop** with a date/time stamp and batch code. **Save this roast** stores the current chart manually (e.g. after a test run); the drop-down lists saved roasts for **Load** / **Del**. A loaded roast is shown for review — live readings from a connected roaster are not drawn over it until you press **Charge** (or **Clear chart**). Its Charge, turning point, Dry End, First Crack and Drop are drawn as labelled lines with their times and bean temperatures (e.g. *First crack 8:02 · 196.4 °C*); DE/FC fall back to the DE/FC-temp crossings when they were not tagged.
- **Roast notes** follows the current roast — the one roasting, just dropped, or loaded from the list — and saves as you type. **☆ Star** marks an excellent roast so it stands out in the list.
- **Download CSV** exports the current chart's samples (time, bean and exhaust temperatures, heater, fan, target, events) with the roast details in a header, for Excel or Artisan.
- **Overlay as background** ghosts a saved roast onto the chart, aligned at Charge, and shows a live **BT delta vs background** readout so you can roast to match it. **✕ clear BG** removes it.
- The bean and green weight you chose in the Start cycle dialog are stored with each roast and shown in its list entry.

---

## 8. Green coffee inventory

Optional, but it makes batch planning and weight tracking automatic.

1. In **Green coffee inventory** press **+ Add bean** and enter the name, origin, available weight, and notes. Or press **📷 Photo label (OCR)** and photograph the bag's spec label — on-device text recognition (English and Chinese) fills the fields for you to check.
2. Set your roaster's **Batch size** range (e.g. 100–200 g). Each bean card then shows a suggested even split (e.g. *5 × 170 g*) so you do not end up with an awkward leftover. **⚖️ Batch planner** does the same for any weight you type in.
3. When starting a roast, pick the bean and the green weight in the dialog that opens from **Start between-batch cycle**.
4. At **Stop / Drop** the batch's green weight is deducted from stock. Out-of-stock beans are flagged in the list.

**AI label reading (optional)** — inside **🤖 AI label reading**, you can point the photo reader at Claude or Gemini for much better results on messy or multi-language labels. Paste **your own** API key (stored in this browser only and never synced), or set a **Proxy Worker URL** so the key never lives on the device. The photo is sent to your own account and billed to you. Leave both fields empty to keep using on-device OCR.

---

## 9. Using more than one device (Cloud sync)

Profiles, roast logs and inventory can be shared between your phone, tablet and computer through a small Cloudflare Worker that **you** own — free, no account in the app.

Setup takes about 10 minutes once and is walked through click by click in **[CLOUD_SYNC.md](CLOUD_SYNC.md)**. In short: create the Worker from `sync-worker.js`, paste its URL into the **Cloud sync** panel, press **Generate** for a sync code, **Connect**, then enter the same URL and code on your other devices.

The sync code is the password: anyone with it can read and write your data, so keep it private. Never share your Worker URL publicly either.

---

## 10. Advanced mode (experienced users only)

Ticking **Advanced mode** (below the Profile designer) reveals two open-loop tools that drive the heater **directly in manual mode**. Stay at the machine while they run; **Stop / Drop** on the Controls rail still works.

- **ET-track roast** — replays a saved roast by its *exhaust* temperature, using the reference's recorded heater % as feedforward with trim on the ET error, and replays its fan curve. The run ends when the bean temperature reaches the **Drop at BT** you set. Arm it for auto-charge to use it in the between-batch flow instead of a profile.
- **Power profile** — distils a saved roast's heater curve into a fixed schedule of power steps (`time heater% [fan%]`, one per line) and runs it with zero mid-roast adjustments. Set **Drop at BT** as a safety net.

Both are experimental. Do a few normal profile roasts first so you know how your machine behaves.

---

## 11. Safety checklist

- Fan on before heater on. The app enforces airflow in its automated flows, but in manual fan control it is on you.
- **Enable control** is per session — it resets when you reload, which is intentional.
- Stay with the machine. Alarms and warnings are aids, not supervision.
- **If the Bluetooth link drops mid-roast** the roaster keeps whatever heater / PID setting it last received — it does not know the app is gone. The app runs a link-loss protocol: it alarms, keeps the roast and any running profile / cycle **paused** (nothing is thrown away), reconnects to the same roaster by itself every few seconds for up to 3 minutes, and on reconnection re-sends the current heater command and resumes the run on the same clock (the chart shows a gap). Watch the red banner: **if it has not reconnected within a minute, cut the heat at the machine.** Pressing **Disconnect** yourself, or a drop with nothing running, simply stops everything as before.
- If in doubt: **Stop / Drop** on the Controls rail.

---

## 12. Troubleshooting & FAQ

| Problem | What to try |
|---|---|
| "Web Bluetooth isn't available" banner | Use Chrome or Edge, not Safari or Firefox. On iOS use another device. |
| Roaster not in the device list | Power-cycle the roaster, close the vendor app, tick **List all Bluetooth devices**, move closer. |
| Connected but tiles show `—` | Open **Connection details / advanced**. If the Notify/Write fields are `—`, the service was not found: use the free **nRF Connect** app to read the roaster's Service UUID and paste it into the custom Service UUID box, then reconnect. |
| Buttons do nothing | **Enable control** is not ticked, or the roaster is disconnected. |
| Red "Bluetooth lost" banner during a roast | The link dropped. The app is reconnecting by itself and the run is paused, not lost. If it is not back within a minute, cut the heat at the machine; press **Reconnect now** once the roaster is back in range. |
| Heater will not fire | The fan is at 0. Set a fan speed first. |
| Auto-charge did not trigger | The bean-probe drop was too small or slow (small batch, low charge temp). Press **▶ Run profile** to start the curve now; next time use a larger batch or a higher charge temperature so the plunge is clearer. |
| RoR trace is jagged | Increase **RoR smooth** or lengthen **RoR window** under the chart. |
| Profile started but the fan stayed put | No fan values in the profile and Auto fan off — control the fan by hand, or tick **Auto fan** and re-run. |
| My saved data is gone | Data is stored per browser and per site URL. Check you are on the same URL and browser, or set up Cloud sync. Clearing site data deletes it. |
| I want °F | Not supported yet; the app works in °C throughout. |

Still stuck? Open the **Raw fields & log** section at the bottom of the Data panel — it shows the raw telemetry frames and a log of every command sent, which is the first thing to include when asking for help.
