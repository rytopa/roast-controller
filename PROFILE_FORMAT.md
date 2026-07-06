# Roast profile format — instructions for generating profiles

You are designing a coffee roast profile for a small **Hamid / Matchbox (TC4-class)** electric drum roaster controlled by the Roast Controller web app. Your output will be imported directly into the app, which drives the roaster's PID setpoint along your curve. Follow this spec exactly.

## What to output

A single JSON object, delivered as a **downloadable `.json` file** (not just a code block), in this format:

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

## Fields

| Field | Required | Meaning |
|---|---|---|
| `format` | yes | Always the literal string `"roast-profile-v1"`. |
| `name` | yes | Short profile name — bean/style/level, e.g. `"Ethiopia natural — filter, 205 drop"`. |
| `notes` | recommended | A short write-up (a few sentences): what the curve is doing and why, the per-minute deltas, intended first-crack timing, development, and the drop/end-of-roast target. This is shown to the roaster operator in the app. Max 4000 characters. |
| `points` | yes | The curve, ≥ 2 points. |
| `points[].time` | yes | Time from **Charge** (beans in) as `"m:ss"`. Plain seconds are also accepted. |
| `points[].targetC` | yes | Target **bean temperature** in °C at that time. Valid range 0–260. |
| `points[].fanPct` | optional | Fan/airflow 0–100 at that time. Omit the key entirely on every point to leave the fan under the operator's manual control — but if you set it on any point, set sensible values throughout. |

## How the app runs your curve (design accordingly)

- The app **linearly interpolates** between your points every 2 seconds and moves the roaster's PID setpoint along the line. Points are anchors, not steps — one point per minute is the usual resolution; use 30 s spacing only where the curve bends fast.
- The setpoint is the *target the bean temperature is asked to track*. PID gains are fixed in firmware, so **your curve's slope is the RoR control**: a smooth, monotonically **declining** rate of rise (large deltas early, small late) is what avoids overshoot and flick-ups. Write the per-minute deltas in `notes`.
- The first point (at `0:00`) is the target right after charge — typically 90–120 °C, not room temperature and not the finish temperature.
- The last point is the end of the profile; the app stops commanding there. The final `targetC` is the drop / end-of-roast temperature (typical range: ~195–205 °C for light/filter, ~210–220 °C for espresso/dark on this machine's bean probe).
- Fan: never 0 while heating (airflow is required for the heater to fire). Typical values 35–70: higher early for drying and to moderate heat, tapering down toward the finish to build momentum. Fan values are also linearly interpolated.
- Total length typically 8–14 minutes charge-to-drop. Temperatures are bean-probe (BT) readings on a small machine — do not exceed 240 °C as a target, and never 260.

## Rules

1. Output **valid JSON only** in the file — no comments, no trailing commas, no markdown inside the file.
2. Times ascending from `"0:00"`; temperatures within 0–260; fan within 0–100.
3. Ask the user (or infer from context) before designing: bean/process, batch size, roast level (filter/espresso, light/dark), and any known machine quirks — then say in `notes` what you assumed.
4. Keep `name` filename-friendly; the app derives the download name from it.
