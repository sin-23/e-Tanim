# e-Tanim: Web Dashboard

> Web dashboard for **e-Tanim: AI-Assisted Integrated Crop Management System**, an
> irrigation, misting, fertilization and harvest-readiness monitor for tomato,
> eggplant and bell pepper.
> Holy Angel University · BS Computer Engineering · School of Engineering and Architecture · 2026
> Francine Avielle E. Sayson · Rinan Geo M. Sundiang · Haygies Jessica G. Suñga

The dashboard is the remote interface of e-Tanim. It shows live readings and status
and sends manual override commands. **It does not decide when to irrigate, mist or
fertilize.** Those decisions run on the ESP32-WROOM-32D and work without internet.
Firebase only carries data, commands and log entries between the devices and this
dashboard.

Related repository: `eTanim-inference` (Mini PC harvest-maturity pipeline).

---

## Features

| Area | What the dashboard does |
|------|-------------------------|
| Environmental sensors | Average temperature, humidity and soil moisture; per-zone readings with VPD (Tetens equation) and an estimated irrigation trigger score |
| Climate zones | **Lowland** = tomato (`zone-1`) + eggplant (`zone-2`), readings averaged. **Highland** = bell pepper (`zone-3`) |
| Manual override | Timed ON/OFF for lowland irrigation, highland irrigation, fertilizer and misting, with auto-off |
| Auto-mode settings | Irrigation thresholds per zone, misting thresholds (temperature and humidity) |
| Fertilizer schedule | Start and end time and days of the week, applied to the single shared fertilizer line |
| Reservoir levels | Water and fertilizer level bars, low-level banner at 30% or below, stale-data detection |
| Misting status | Manual state, highland reading against thresholds, water-reservoir lockout |
| Harvest maturity | Underripe, ripe and damaged counts per crop from the Mini PC, READY TO HARVEST badge |
| Notifications | Bell with unread badge for `reservoir_low` and `harvest_ready` |
| Activity log | Shared, append-only feed of manual actions, timer shutoffs, threshold and schedule changes |
| Display | Dark mode, °C/°F toggle (all stored values stay in °C) |

Pages: **Dashboard**, **Irrigation & Fertilization**, **Settings**.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue 3 (Composition API), Vue Router 4 |
| Build tool | Vite 5 (single-file build via `vite-plugin-singlefile`) |
| Styling | Tailwind CSS 3 |
| Live state | Firebase Realtime Database (JavaScript SDK v10) |
| Activity log | Cloud Firestore (JavaScript SDK v10) |
| Hosting | Firebase Hosting (`dist/`, security headers in `firebase.json`) |

There is no custom backend: no Flask, Express, Cloud Functions, MQTT broker or GraphQL
server. An "endpoint" in e-Tanim is a path in the database.

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Configure Firebase

Create a `.env` file in the project root (`.env` and `.env.*` are git-ignored, so
there is no `.env.example` in the repository). Values come from the
[Firebase Console](https://console.firebase.google.com/) → Project settings → Your apps.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

`API_KEY`, `DATABASE_URL` and `PROJECT_ID` are required. If they are missing, the app
shows a "Firebase Not Configured" screen. **There is no demo mode** in the current build.

### 3. Run and build

```bash
npm run dev       # development server
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

### 4. Deploy

```bash
firebase deploy --only hosting,database
```

`firebase.json` currently configures hosting and Realtime Database rules only.
`firestore.rules` must be published from the Firebase Console (or add a `firestore`
entry to `firebase.json`).

---

## Data model

The database layout follows the schema in the paper (Section 2.2, Database Design).

### Realtime Database (live state)

| Path | Contents | Writer | Reader |
|------|----------|--------|--------|
| `sensors/zone-1..3` | `moisture` (0–100), `temperature` (−40 to 85), `humidity` (0–100), `updatedAt` (epoch ms), optional `plant` | ESP32 | Dashboard |
| `averages/{temperature\|humidity\|moisture}` | Number | ESP32 | Dashboard |
| `control/{relay_lowland\|relay_highland\|relay_fert\|relay_mist}` | Boolean manual override flag | Dashboard | ESP32 |
| `control/{name}_off_at` | Epoch ms auto-off deadline, or `null` | Dashboard | Dashboard |
| `config/fert_schedule` (+ `_updated`) | `startHour`, `startMinute`, `endHour`, `endMinute`, `days` (`sun`–`sat`) | Dashboard | ESP32, dashboard |
| `config/thresholds`, `config/thresholds_highland` (+ `_updated`) | Irrigation thresholds per zone | Dashboard | ESP32, dashboard |
| `config/misting` (+ `_updated`) | `tempOn` (°C), `humidityOn` (%) | Dashboard | ESP32, dashboard |
| `reservoirs/{water\|fertilizer}` | `levelPct`, `low`, `updatedAt` | ESP32 | Dashboard |
| `detections/{tomato\|eggplant\|bell_pepper}` | `underripe`, `ripe`, `damaged`, `confidence` (0–1), `updatedAt` | Mini PC | Dashboard |
| `notifications/{id}` | `type` (`reservoir_low` \| `harvest_ready`), `source`, `message`, `createdAt` | ESP32 or Mini PC | Dashboard |

`_updated` fields are epoch-second change markers so the ESP32 downloads a config
only when it changes. Every payload the dashboard reads is validated before display
(`src/security/validator.js`); unknown fields, wrong types and out-of-range values
are rejected.

### Cloud Firestore (activity log)

Entries are appended at `activity_log/system/entries` with `message`, `color`
(`#RRGGBB`), `type`, `timestamp` (epoch ms) and a server `createdAt`. Rules allow read
and create, and deny update and delete. The paper specifies a 30-day retention through
a time-to-live policy on `createdAt`, which is configured in Firestore, not in this repo.

### Sample sensor payload

```json
{
  "sensors": {
    "zone-1": { "plant": "tomato",      "moisture": 62, "temperature": 31.0, "humidity": 68, "updatedAt": 1790000000000 },
    "zone-2": { "plant": "eggplant",    "moisture": 58, "temperature": 31.5, "humidity": 66, "updatedAt": 1790000000000 },
    "zone-3": { "plant": "bell_pepper", "moisture": 66, "temperature": 26.0, "humidity": 78, "updatedAt": 1790000000000 }
  }
}
```

The dashboard accepts only these plants: `tomato`, `eggplant`, `bell_pepper`.

---

## Constants that must match the firmware

These values are **provisional** and live in the dashboard. The ESP32 firmware makes
the actual decisions, so keep both sides identical.

| Constant | Value | Location |
|----------|-------|----------|
| Irrigation score weights (moisture / VPD) | 60 / 40 | `SCORE_DEFAULTS` in `src/composables/useSensorData.js` |
| Moisture dry / wet points | 30 % / 60 % | same |
| VPD band, lowland / highland | 0.8–1.6 / 0.6–1.2 kPa | `ZONE_META` in the same file |
| Score that requests irrigation | 50 | same |
| Irrigation threshold defaults | temp on 40 / off 15 °C, moisture on 30 / off 60 % | `IRRIGATION_DEFAULTS` in `src/components/RelayControl.vue` |
| Misting defaults | 32 °C, 70 % | `THRESHOLD_CONFIG` in `RelayControl.vue` and `MISTING_DEFAULTS` in `src/composables/useMisting.js` |
| Reservoir low level | 30 % | `RESERVOIR_LOW_PCT` in `src/security/validator.js` |

The score shown on the dashboard is an estimate for display. It is not the command
that opens a valve.

Misting starts when highland temperature is at or above its threshold **or**
humidity is at or below its threshold (`eTanim_decision_log.md` item 3, RESOLVED;
matches DOC-CAP-FINAL 2.3's pseudocode). Confirm the firmware uses the same rule.

### Freshness rules

| Data | Marked stale after | Why |
|------|--------------------|-----|
| Reservoir reading | 3 min | ESP32 heartbeat is 60 s |
| Harvest detection | 45 min | Mini PC heartbeat is 30 min |
| Highland reading (misting panel) | 60 s | ESP32 uploads every 10 s |

---

## Security and access

Sign-in was removed on the panel's advice, so the dashboard opens directly and the
database rules do not check identity. This fits the single-user scope of the study.

- `sensors`, `averages`, `reservoirs`, `detections` and `notifications` are not writable from browsers. The ESP32 (database secret) and the Mini PC (`firebase-admin`) bypass rules.
- `control` and `config` paths are writable without identity. Anyone who knows the database URL could change a control flag, so field validation is enforced in the rules.
- Client-side limit of 20 activity-log writes per minute; Firestore rejects entries whose timestamp is more than 5 minutes off.
- Firebase errors are never shown raw, to avoid exposing project details.
- Hosting sends HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a restrictive permissions policy.

`src/auth/useAuth.js` is a disabled stub kept for compatibility.

---

## Project structure

```
src/
├── main.js, App.vue, style.css, firebase.js
├── router/index.js                    # dashboard, irrigation, settings
├── auth/useAuth.js                    # disabled stub (no sign-in)
│
├── views/
│   ├── Dashboard.vue                  # sensors, reservoirs, misting, harvest, activity log
│   ├── IrrigationView.vue             # override controls, fertilizer schedule, zone readings
│   └── SettingsView.vue               # dark mode, temperature unit
│
├── components/
│   ├── AppNavBar.vue, SidebarNav.vue
│   ├── NotificationBell.vue           # unread badge + dropdown
│   ├── RelayControl.vue               # manual override + threshold settings (4 circuits)
│   ├── FertScheduleCard.vue           # fertilizer schedule editor
│   ├── ZoneCard.vue, SensorGauge.vue, SensorStat.vue
│   ├── ReservoirCard.vue              # level bar + low alert
│   ├── MistingStatusCard.vue          # misting status
│   └── DetectionCard.vue              # harvest maturity per crop
│
├── composables/
│   ├── useSensorData.js               # zones, VPD, irrigation score
│   ├── useReservoirs.js               # reservoirs/*
│   ├── useDetections.js               # detections/*
│   ├── useMisting.js                  # misting state, thresholds, highland reading
│   ├── useNotifications.js            # notifications/* (latest 20, per-browser read state)
│   ├── useActivityLog.js              # Firestore log writer + live feed
│   ├── useRelayAutoOff.js             # enforces *_off_at deadlines, logs shutoffs once
│   └── useTempUnit.js, useDarkMode.js
│
└── security/
    ├── validator.js                   # payload validation for every node read
    └── rateLimiter.js                 # client-side rate limiting
```

`database.rules.json` and `firestore.rules` are in the project root.

---

## Standards alignment

The dashboard is the software-quality subject of ISO/IEC 25010:2023 in the paper
(Table 3): functional suitability (monitoring, manual override, notifications),
performance efficiency (prompt response to user input) and a simple user interface.

---

## Current status and known limitations

- **Firmware not yet verified against the dashboard.** The ESP32 must read the four `control/relay_*` paths, write `reservoirs/*` (`levelPct`, `low`, `updatedAt`) and write `reservoir_low` notifications. It must also stop reading the old `relay`, `relay2`, `relay3`, `thresholds_pump2` and `fert_active_source` paths.
- **Harvest maturity is blocked on the evaluator models.** Until the three YOLO11m-cls evaluators exist, `underripe`, `ripe` and `damaged` are always 0 and no `harvest_ready` notification is written. The orchestrator model does not yet detect bell pepper.
- **Misting state is estimated.** The schema has no node where the ESP32 reports whether the misting relay is actually on. Misting GPIOs are still "Not assigned" in the paper.
- **Only the latest harvest counts are shown.** The paper mentions harvest maturity history, but nothing stores it yet.
- **Events that happen on the devices are not in the activity log.** Automatic irrigation, misting and fertilizer runs, low-reservoir events and detections are not written to Firestore, because the ESP32 and Mini PC write only to the Realtime Database.
- **Notifications are never deleted.** The dashboard shows only the newest 20 and tracks read state in the browser (localStorage). A retention policy is not defined.
- **Single user only,** by design.
- `package.json` still uses the old name `guarden-dashboard`, and `tailwind.config.js` still defines an unused `okra` color.