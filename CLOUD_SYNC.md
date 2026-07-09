# Cloud sync — full setup guide

Sync your **profiles and roast logs** across all your devices (iPad, phone, computer) through a small **Cloudflare Worker + KV** store that **you own**. No accounts for the app, no third-party service holding your data — devices that share one private **sync code** see the same data, and changes merge automatically.

## What you need

- A **free Cloudflare account** — sign up at [dash.cloudflare.com](https://dash.cloudflare.com). No paid plan and no credit card are needed for the Workers/KV free tier.
- About **10 minutes**, once. After setup you only ever paste a URL and a code into the app.
- The file **[`sync-worker.js`](sync-worker.js)** from this repo (you'll paste its contents in Part B).

> Cloudflare occasionally renames dashboard menus. Where a label may differ, the older/alternate name is given in parentheses. The **browser test in Part D** is the real proof it works — if you see the expected JSON there, your setup is correct regardless of menu names.

---

## Part A — Create the KV namespace (the storage)

1. Sign in at **[dash.cloudflare.com](https://dash.cloudflare.com)**.
2. In the left sidebar, open **Storage & Databases → KV** *(older dashboards: **Workers & Pages → KV**)*.
3. Click **Create a namespace**.
4. Name it `roast-sync` and click **Add**.

This is the little database your profiles and roasts will live in.

## Part B — Create the Worker (the API)

5. Left sidebar → **Workers & Pages** *(may be labeled **Compute (Workers)**)* → **Create** → **Create Worker**.
6. Give it a name, e.g. `roast-sync`, then click **Deploy** (it deploys a placeholder "Hello World" worker — that's expected).
7. Click **Edit code** (top-right, the `</>` icon).
8. Select **all** the placeholder code and delete it, then **paste the entire contents of `sync-worker.js`**.
9. Click **Deploy** (top-right).

## Part C — Connect the Worker to the KV (the binding)

This is the step people miss — the Worker can't store anything until it's bound to the namespace.

10. Go to the Worker's **Settings** tab → **Bindings** *(older dashboards: **Settings → Variables → KV Namespace Bindings**)*.
11. Click **Add binding → KV namespace**.
12. **Variable name:** type **`SYNC`** exactly — uppercase, no spaces. *(If this name is wrong, the app will report `KV binding "SYNC" missing`.)*
13. **KV namespace:** choose `roast-sync` (from Part A).
14. **Save** / **Deploy**.

## Part D — Get the URL and test it

15. On the Worker's overview page, copy its URL. It looks like:
    `https://roast-sync.<your-subdomain>.workers.dev`
16. **Test it:** open this address in any browser (paste your real subdomain):
    ```
    https://roast-sync.<your-subdomain>.workers.dev/d/testtesttesttest
    ```
17. You should see exactly:
    ```json
    {"v":1,"rev":0,"profiles":[],"logs":[],"tombs":{}}
    ```
    If you see that JSON, **the backend is working.** (If you see `KV binding "SYNC" missing`, redo Part C.)

## Part E — Connect the app on each device

**On your main device** (the one that already has your profiles/roasts):

18. Open the app → scroll to the **Cloud sync** panel.
19. Paste the Worker URL into **Worker URL**.
20. Click **Generate** to create a fresh sync code.
21. Click **Connect**. The status line shows **"Synced — …"** and your local data is uploaded.
22. **Write the code down** — you'll need it on your other devices.

**On every other device:**

23. Open the app → **Cloud sync**.
24. Paste the **same** Worker URL.
25. Type the **same** sync code (exactly).
26. Click **Connect** — it downloads everything.

From now on it stays in sync **automatically**: a change pushes ~1.5 s after you make it, each device pulls every 45 seconds, and it also syncs whenever you switch back to the app's tab. There's a **Sync now** button if you want to force it.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| App status: **`KV binding "SYNC" missing`** | Part C wasn't done, or the variable name isn't exactly `SYNC` (uppercase). Re-add the binding and Deploy. |
| App status: **`Sync error: HTTP 400`** | The sync code has illegal characters. It must be 16–64 characters, letters/digits/`-`/`_` only — click **Generate** for a valid one. |
| App status: **`Sync error: HTTP 404`** or a Cloudflare error page | The Worker URL is wrong, or you pasted it with a trailing path. Use just `https://…​workers.dev`. Re-run the Part D browser test. |
| **Nothing appears on the second device** | The URL or code doesn't match exactly (they're case-sensitive), or that device is offline. Compare both fields character-for-character. |
| **A deleted profile/roast came back** | It probably still existed on another device that hadn't synced yet; delete it again while that device is online, or delete on the device that still shows it. |
| **Two devices edited the same profile** | The **newer edit wins** for that record. Different records from both devices are all kept. |

**Free-tier limits:** Cloudflare KV free tier allows ~1,000 writes and 100,000 reads per day — far beyond personal roasting use. The app batches/debounces writes to stay well under this.

**Rotating the code:** to start fresh or lock out a shared code, click **Generate** on your main device and **Connect** (this begins a new dataset), then re-enter the new code on your other devices. The old code's data stays in KV until you remove it (below).

## Privacy & security

- The sync code is **both the address and the password** — anyone who has it can read and write that dataset. Keep it private; treat it like a password.
- Data travels over **HTTPS** to **your own** Worker. It is not sent anywhere else.
- **To wipe cloud data:** in the Cloudflare dashboard open your `roast-sync` KV namespace and delete the entry named `d:<your-code>` (or delete the whole namespace). Your on-device data is unaffected; disconnect in the app if you also want to stop syncing.
