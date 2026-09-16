# Roast Controller: UI audit and design direction

Audit baseline: `964522d` on `main`, and the deployed v1.2.1 interface at https://rytopa.github.io/roast-controller/ (16 September 2026).

## What exists

The app is a static, framework-free page. `index.html` contains the markup, base CSS, canvas rendering, Web Bluetooth connection and command queue, roast state, profile tooling, local storage, inventory and sync client. Separate Cloudflare Workers provide optional sync and AI label-reading services. Tesseract is loaded from a CDN. There is no package/build/test pipeline to migrate.

The live page uses three columns: a tall telemetry rail, a squeezed central chart and a control rail. Setup, operation and reference explanations are visually similar. Most supporting tools require a long scroll. Important shortcuts are hidden in value tiles, the heater/fan OFF actions look like labels, and several inputs/buttons have ambiguous accessible names. On phones the same dense sequence becomes especially long. Canvas backing dimensions only update when width changes, which breaks height-only viewport resizing.

Existing strengths to retain: real telemetry with units, distinct trace colors, temperature/output chart panes, phase and event markings, guarded hardware commands, a control-enable gate, connection-loss feedback, explicit stop/drop behavior, local profiles/logs and day/night themes.

## Direction implemented

A quiet instrument dashboard with warm ivory and forest tones by day, charcoal and amber at night. Keep the roasting information central; use color consistently for data channels and reserve solid red for Heater off / Drop. Avoid dependencies, font downloads, generated decorative imagery, or a framework migration.

| Area | Treatment |
| --- | --- |
| Hierarchy | Header → section navigation → connection/safety → telemetry strip → large chart and control rail → preparation → profile designer → history → sync/inventory |
| Typography | System sans-serif; 20–22 px page titles, 14 px controls, 12 px supporting text; tabular numerals and 28–42 px telemetry |
| Spacing | 12–32 px outer gutters, 14–18 px panel gaps, 18–26 px panel padding; soft borders and 18 px card corners |
| Color | Day: ivory `#f4f3ed`, forest text `#243c36`, green accent `#315c4e`. Night: charcoal `#121718`, off-white `#f2f1eb`, amber `#e9b885`. Keep established BT/ET/RoR trace colors. |
| Navigation | Sticky native anchor links; no unmounting, hidden live workspace, or route changes that could interrupt a roast |
| Charts | More horizontal room, larger profile editor, explanatory plan/live text, labelled legend, retained inspection/phase/overlay behavior; correct backing resolution on width **or height** changes |
| Controls | Explicit OFF labels, visible ±5 affordance, accessible names and expanded states, manual-takeover explanation, persistent Heater off / Drop shortcut routed through the existing stop handler |
| Progressive disclosure | Connection discovery, detailed control instructions, manual-roast guidance, charge-soak explanation and graph-editing help remain available on demand |
| Responsive layout | Six telemetry columns on wide screens; three on smaller screens. Below 800 px, chart and controls stack in DOM order, navigation scrolls horizontally, stop stays at the bottom, and fields use 16 px text. |
| Accessibility | Skip link, navigation/main/section landmarks, visible focus rings, named key controls, connection status announcement, 44 px standard buttons, reduced-motion support |

`dashboard.css` is the presentation layer over the existing base styles. `dashboard.js` supplies UI-only labels, anchor state and the stop shortcut. Hardware command logic, storage keys, imports/exports, Workers and all 233 original element IDs are preserved. Inline application changes are limited to help copy, expanded/theme accessibility state and canvas resize conditions.

## Verification

- Both JavaScript files pass Node syntax checks; whitespace/diff checks pass.
- All 233 original IDs are retained, with no duplicate IDs.
- Browser checked in night and day themes, including remembered theme after reload.
- Tested 390 px phone, 820 px tablet and 1280 px desktop viewports; no page-level horizontal overflow at those sizes (navigation intentionally scrolls).
- Keyboard Enter opens the heater ±5 row and updates `aria-expanded`.
- Saved a test profile, reloaded and confirmed it remained available. Inventory add/save displays the new item.
- Profile points table fits on phone width; navigation and persistent stop remain reachable.
- At fixed 1280 px viewport width, changing height from 900 to 1100 updates chart backing height from 466 to 570 px with width unchanged at 825 px.
- Browser error log was empty during the tested flows.

No roaster was paired. Live telemetry, physical heater/fan actuation, reconnect behavior and an actual full roast are not hardware-validated. Cloud sync and OCR/provider calls were not exercised. Existing safety paths were retained, not certified by this UI check.

## Suggested next iteration

1. Extract Bluetooth transport, roast state, storage and chart rendering into separate modules with a simulated-device harness. This would enable repeatable connection-loss and stop-path regression tests before changing any control logic.
2. Add a compact review table for saved roasts (bean, date, duration, drop temperature and notes) while keeping existing storage/import formats.
3. Give chart hover values a keyboard-accessible time selector and structured data table; a canvas description alone is not equivalent access to every plotted sample.
4. Add consistent labels to every advanced/generated field and proper focus management to existing inventory/batch dialogs.
5. Test with a connected roaster and representative full roast logs before merging; check phase transitions, manual takeover and emergency stop across phone/tablet layouts.
