# e-Tanim: Web Dashboard

> Web dashboard for **e-Tanim: AI-Assisted Integrated Crop Management System**, an
> irrigation, misting, fertilization and harvest-readiness monitor for tomato,
> eggplant and bell pepper.
> Francine Avielle E. Sayson · Rinan Geo M. Sundiang · Haygies Jessica G. Suñga

The dashboard is the remote interface of e-Tanim. It shows live readings and status
and sends manual override commands. **It does not decide when to irrigate, mist or
fertilize.** Those decisions run on the ESP32-WROOM-32D and work without internet.
Firebase only carries data, commands and log entries between the devices and this
dashboard.

Related repositories: `esp32_firmware` (ESP32 control logic) and `eTanim-inference`
(Mini PC harvest-maturity pipeline).

---

## Features

| Area | What the dashboard does |
|------|-------------------------|
| Accounts | Email and password sign-in. Registration needs the device code printed (as a QR code and as text) on the e-Tanim unit. Password reset by email |
| Environmental sensors | Average temperature, humidity and soil moisture; per-zone readings with VPD and the irrigation state each zone is in (stop, emergency, normal, idle) |
| Climate zones | **Lowland** = tomato (`lowland-t`) + eggplant (`lowland-e`), readings averaged. **Highland** = bell pepper (`highland`) |
| Manual override | Timed ON/OFF for lowland irrigation, highland irrigation, fertilization and misting, with auto-off |
| Auto-mode settings | Per zone: `smNormal`, `smEmergency`, `smStop` (soil moisture, %) and `vpdGate` (kPa). Misting: temperature and humidity thresholds |
| Fertilization schedule | Start and end time and days of the week, applied to the single shared fertilization line |
| Reservoir levels | Water and fertilizer level bars, an editable alert level (5 to 95%, default 30%), stale-data detection |
| Misting status | Manual state, highland reading against thresholds, water-reservoir lockout |
| Harvest maturity | Underripe, ripe and damaged counts per crop from the Mini PC, READY TO HARVEST badge |
| Notifications | Bell with unread badge for `reservoir_low` and `harvest_ready` |
| Activity log | Shared, append-only feed of manual actions, timer shutoffs, threshold and schedule changes, tagged with who did them |
| Display | Dark mode, °C/°F toggle (all stored values stay in °C) |

Pages: **Dashboard**, **Crop Monitor**, **Irrigation, Fertilization & Misting**,
**Reservoir Levels**, **Activity Log** and **Settings**, plus the sign-in pages
(**Login**, **Register**, **Reset Password**). Every page except the sign-in pages
requires a signed-in account.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue 3 (Composition API), Vue Router 4 |
| Build tool | Vite 5 (single-file build via `vite-plugin-singlefile`) |
| Styling | Tailwind CSS 3 |
| Accounts | Firebase Authentication (email and password) |
| Live state | Firebase Realtime Database (JavaScript SDK v10) |
| Activity log | Cloud Firestore (JavaScript SDK v10) |
| QR scanning | `jsqr`, reading the camera through `getUserMedia` |
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

Create a `.env` file in the project root. `.env` and `.env.*` are git-ignored, so
copy the template below. Values come from the
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

In the Firebase Console, turn on **Authentication → Email/Password**. Other providers
(including Google) should stay off, because the device code is what gates registration.

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

## Accounts and device codes

Every physical unit carries a **device code** (for example `ET-7F3K2Q`) printed as a QR
code and as plain text. To register, a person scans the QR code (or types the code),
then creates an account with an email and password.

- Codes are **reusable**. Several accounts (for example a household) can join one unit
  with the same code. Each account that joins is added under
  `deviceAccessCodes/{code}/members/{uid}`.
- After sign-up, the dashboard saves `systemId` and the normalized `code` under
  `users/{uid}`. The database rules use the code to check membership.
- A code is stripped to capitals and digits (A–Z, 0–9) and must be 6 to 12 characters.
  The hyphen in a printed label is not part of the database key: `ET-7F3K2Q` is stored
  as `ET7F3K2Q`.
- The QR may contain the bare code or a URL with a `code` query parameter. Both are
  read the same way. The app never opens the URL.
- Codes are created by hand in the Firebase Console. A code record has `systemId`
  (string, up to 32 characters) and `active: true`. Set `active` to `false` to turn a
  code off. Do not create `members`; the app adds it.

The code check happens before sign-in, so `deviceAccessCodes/{code}` is publicly
readable. This keeps casual sign-ups out. It is not a hard security boundary.

---

## Data model

The database layout follows the schema in the paper (Section 2.2, Database Design).

### Realtime Database (live state)

| Path | Contents | Writer | Reader |
|------|----------|--------|--------|
| `sensors/lowland-t`, `lowland-e`, `highland` | `moisture` (0–100), `temperature` (−40 to 85), `humidity` (0–100), `updatedAt` (epoch ms), optional `plant` | ESP32 | Dashboard |
| `averages/{temperature\|humidity\|moisture\|vpd}` | Number | ESP32 | Dashboard |
| `control/{relay_lowland\|relay_highland\|relay_fert\|relay_mist}` | Boolean manual override flag | Dashboard (members) | ESP32 |
| `control/{name}_off_at` | Epoch ms auto-off deadline, or `null` | Dashboard (members) | Dashboard |
| `config/fert_schedule` (+ `_updated`) | `startHour`, `startMinute`, `endHour`, `endMinute`, `days` (`sun`–`sat`) | Dashboard (members) | ESP32, dashboard |
| `config/thresholds` (lowland), `config/thresholds_highland` (+ `_updated`) | `smNormal`, `smEmergency`, `smStop` (%), `vpdGate` (kPa) | Dashboard (members) | Dashboard. The firmware does not read them yet |
| `config/misting` (+ `_updated`) | `tempOn` (°C), `humidityOn` (%) | Dashboard (members) | ESP32, dashboard |
| `config/reservoir_low` (+ `_updated`) | `water`, `fertilizer` (whole numbers, 5 to 95) | Dashboard (members) | Dashboard. The firmware does not read it |
| `reservoirs/{water\|fertilizer}` | `level` (0–100), `low`, `updatedAt` | ESP32 | Dashboard |
| `detections/{tomato\|eggplant\|bell_pepper}` | `underripe`, `ripe`, `damaged`, `confidence` (0–1), `updatedAt` | Mini PC | Dashboard |
| `notifications/{id}` | `type` (`reservoir_low` \| `harvest_ready`), `source`, `message`, `createdAt` | ESP32 or Mini PC | Dashboard |
| `deviceAccessCodes/{code}` | `systemId`, `active`, `members/{uid}` | You (by hand); each account adds its own uid under `members` | Registration page (public read) |
| `users/{uid}` | `systemId`, `code` (plus `email`, `displayName`, `lastLogin` written at sign-in) | The account itself | Signed-in users |

`_updated` fields are epoch-second change markers so the ESP32 downloads a config
only when it changes. Every payload the dashboard reads is validated before display
(`src/security/validator.js`); unknown fields, wrong types and out-of-range values
are rejected.

### Cloud Firestore (activity log)

Entries are appended at `activity_log/system/entries` with `message`, `color`
(`#RRGGBB`), `type`, `timestamp` (epoch ms), a server `createdAt`, and the optional
fields `by` (who did it), `category` and `manual`. Rules allow signed-in users to read
and create, and deny update and delete. A 30-day retention can be set as a
time-to-live policy on `createdAt`, which is configured in Firestore, not in this repo.

### Sample sensor payload

```json
{
  "sensors": {
    "lowland-t": { "plant": "tomato",      "moisture": 62, "temperature": 31.0, "humidity": 68, "updatedAt": 1790000000000 },
    "lowland-e": { "plant": "eggplant",    "moisture": 58, "temperature": 31.5, "humidity": 66, "updatedAt": 1790000000000 },
    "highland": { "plant": "bell_pepper", "moisture": 66, "temperature": 26.0, "humidity": 78, "updatedAt": 1790000000000 }
  }
}
```

The dashboard accepts only these plants: `tomato`, `eggplant`, `bell_pepper`.

---

## Constants that must match the firmware

These values are **provisional** and live in the dashboard. The ESP32 firmware makes
the actual decisions, so keep both sides identical.

| Constant | Lowland | Highland | Location |
|----------|---------|----------|----------|
| `smNormal` (soil moisture at or below this starts a Normal run) | 70 % | 75 % | `LOWLAND_IRRIGATION_DEFAULTS` / `HIGHLAND_IRRIGATION_DEFAULTS` in `src/components/RelayControl.vue`, and `src/composables/useSensorData.js` |
| `smEmergency` (waters regardless of VPD) | 60 % | 70 % | same |
| `smStop` (a running session ends) | 80 % | 80 % | same |
| `vpdGate` (a Normal start also needs VPD at or above this) | 0.6 kPa | 0.6 kPa | same |
| Misting defaults | 32 °C, 70 % | | `THRESHOLD_CONFIG` in `RelayControl.vue` and `MISTING_DEFAULTS` in `src/composables/useMisting.js` |
| Reservoir low level (default) | 30 % | | `RESERVOIR_LOW_PCT` in `src/security/validator.js` |

The irrigation state shown on the dashboard is for display. It is not the command
that opens a valve.

Misting starts when highland temperature is at or above its threshold **or**
humidity is at or below its threshold (`eTanim_decision_log.md` item 3, RESOLVED;
matches DOC-CAP-FINAL 2.3's pseudocode). Confirm the firmware uses the same rule.

### Freshness rules

| Data | Marked stale after | Why |
|------|--------------------|-----|
| Reservoir reading | 3 min | ESP32 heartbeat is 60 s |
| Harvest detection | 45 min | Based on the old 30-minute Mini PC heartbeat. To be changed (see limitations) |
| Highland reading (misting panel) | 60 s | ESP32 uploads every 10 s |

---

## Security and access

Reading and controlling the system are separated:

- **Anyone with the database URL can read** `sensors`, `averages`, `reservoirs`, `detections`, `notifications` and the `control` and `config` paths. The paper states this.
- **Only signed-in members of a unit can write** `control` and `config` paths. The rules check the code's `members` list, not just `users/{uid}/systemId`, because any signed-in user can write their own `users/{uid}` record. A code with `active: false` loses write access.
- `sensors`, `averages`, `reservoirs`, `detections` and `notifications` are not writable from browsers. The ESP32 (database secret) and the Mini PC (`firebase-admin`) bypass rules.
- `users` is readable by signed-in users, and each user writes only their own record.
- Unregistered accounts cannot control the system.
- Activity log: signed-in users only. The client limits itself to 20 writes per minute, and Firestore rejects entries whose timestamp is more than 5 minutes off.
- Firebase errors are never shown raw, to avoid exposing project details.
- Hosting sends HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy and a restrictive permissions policy.

---

## Project structure

```
src/
├── main.js, App.vue, style.css, firebase.js
├── router/index.js                    # public auth routes + protected app routes
│
├── auth/
│   ├── useAuth.js                     # sign-in, sign-out, reset, change email/password
│   └── useDeviceAccessCode.js         # check a device code, join a unit
│
├── views/
│   ├── LoginView.vue, RegisterView.vue, ResetPasswordView.vue
│   ├── Dashboard.vue                  # sensors, reservoirs, misting, harvest, activity log
│   ├── CropMonitorView.vue            # harvest maturity per crop
│   ├── IrrigationView.vue             # override controls, fertilizer schedule, zone readings
│   ├── ReservoirView.vue              # water and fertilizer levels, alert level
│   ├── ActivityLogView.vue            # full activity feed
│   └── SettingsView.vue               # dark mode, temperature unit, account
│
├── components/
│   ├── AppNavBar.vue, SidebarNav.vue
│   ├── DeviceAccessGate.vue           # QR scan or manual code entry
│   ├── NotificationBell.vue           # unread badge + dropdown
│   ├── RelayControl.vue               # manual override + threshold settings (4 circuits)
│   ├── FertScheduleCard.vue           # fertilizer schedule editor
│   ├── ZoneCard.vue, SensorGauge.vue, SensorStat.vue
│   ├── ReservoirCard.vue              # level bar + alert level
│   ├── MistingStatusCard.vue, ControlStatusCard.vue
│   └── DetectionCard.vue              # harvest maturity per crop
│
├── composables/
│   ├── useSensorData.js               # zones, VPD, irrigation state
│   ├── useReservoirs.js               # reservoirs/* and config/reservoir_low
│   ├── useDetections.js               # detections/*
│   ├── useMisting.js                  # misting state, thresholds, highland reading
│   ├── useNotifications.js            # notifications/* (latest 20, per-browser read state)
│   ├── useActivityLog.js              # Firestore log writer + live feed
│   ├── useRelayAutoOff.js             # enforces *_off_at deadlines, logs shutoffs once
│   ├── useQrScanner.js                # camera + jsqr decoding
│   └── useTempUnit.js, useDarkMode.js
│
├── utils/statusTone.js
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

- **Firmware not yet verified against the dashboard.** The ESP32 must read the four `control/relay_*` paths, write `reservoirs/*` (`level`, `low`, `updatedAt`) and write `reservoir_low` notifications. It must also stop reading the old `relay`, `relay2`, `relay3`, `thresholds_pump2` and `fert_active_source` paths.
- **User-set thresholds are not read by the firmware yet.** The dashboard saves `config/thresholds` and `config/thresholds_highland`, but the ESP32 still uses fixed values until it is updated.
- **The reservoir alert level is display-only for now.** The dashboard compares the level with `config/reservoir_low`, while the ESP32 locks the pumps and sends the `reservoir_low` notification at a fixed 30%. A user who sets 50% sees "low" while the pumps still run.
- **Harvest maturity shows only the latest counts.** The Mini PC writes one aggregate per crop. Per-fruit entries, frames and history are not shown yet, and the 45-minute stale limit still assumes the old 30-minute heartbeat.
- **Harvest maturity is blocked on the evaluator models.** Until the three YOLO11m-cls evaluators exist, `underripe`, `ripe` and `damaged` are always 0 and no `harvest_ready` notification is written. The orchestrator model does not yet detect bell pepper.
- **Misting state is estimated.** The schema has no node where the ESP32 reports whether the misting relay is actually on. Misting GPIOs are still "Not assigned" in the paper.
- **Events that happen on the devices are not in the activity log.** Automatic irrigation, misting and fertilizer runs, low-reservoir events and detections are not written to Firestore yet, because the ESP32 and Mini PC write only to the Realtime Database.
- **Zone period averages are not shown.** They are planned in Firestore as `zone_period_averages`; the dashboard does not read them yet.
- **Notifications are never deleted.** The dashboard shows only the newest 20 and tracks read state in the browser (localStorage). A retention policy is not defined.
- **Device codes are a registration gate, not a hard boundary.** The code lookup is a public read.