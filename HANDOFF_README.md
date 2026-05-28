# Supportive Housing Backend — Handoff Documentation

## Overview

This is a Node.js/Express backend serving two IoT-enabled features for the Supportive Housing tablet application: **Smart Pill Dispenser** (medication scheduling with Arduino hardware) and **Smart Cooking Assistant** (step-by-step recipe guidance with stove IoT device). The backend uses SQLite for persistence and is deployed on Render.

---

## Architecture

```
┌─────────────────┐      ┌──────────────────────────────────────┐
│  Tablet App     │      │  Backend (Render)                    │
│  (Android)      │◄────►│  https://androidsupportivehousing    │
└─────────────────┘      │       .onrender.com                  │
                         └──────────────┬───────────────────────┘
                                        │
            ┌───────────────────────────┴───────────────────────────┐
            │                                                       │
            ▼                                                       ▼
┌───────────────────────────┐                           ┌───────────────────┐
│  VPS Proxy (DigitalOcean) │                           │  Stove IoT Device │
│  128.199.7.31:3000        │                           │  (Cooking)        │
│  (runs vps.js)            │                           └───────────────────┘
└─────────────┬─────────────┘
              │ polling
              ▼
┌───────────────────────────┐
│  Arduino Pill Dispenser   │
│  (Hardware)               │
└───────────────────────────┘
```

**Data flow (Pillbox):** Tablet → Backend → VPS → Arduino (poll) → VPS → Backend → Firebase FCM → Tablet notification

**Data flow (Cooking):** Tablet ↔ Backend ↔ Stove IoT (direct or via tablet relay)

---

## Folder Structure

```
├── app.js                    # [Shared] Main Express server, mounts routes
├── seed.js                   # [Shared] Creates SQLite schema on startup
├── package.json              # [Shared] Dependencies and scripts
├── database.db               # [Shared] SQLite database file (gitignored for handoff)
├── database/
│   └── database.js           # [Shared] SQLite connection setup
├── routes/
│   ├── pill.routes.js        # [Pillbox] Pill dispenser route definitions
│   └── pot.routes.js         # [Cooking] Cooking assistant route definitions
├── services/
│   ├── pill.service.js       # [Pillbox] Pill business logic, FCM notifications
│   ├── pot.service.js        # [Cooking] Recipe/step tracking logic
│   └── vps.js                # [Pillbox] VPS proxy server (deployed separately on DO)
├── utils/
│   └── global.js             # [Pillbox] Global state objects (unused in current code)
├── firebaseInit.js           # [Pillbox] Firebase Admin SDK initialization
├── initialRecipeData.js      # [Cooking] Hardcoded recipe data (Chicken Teriyaki)
└── .gitignore                # Ignores node_modules, .env, serviceAccountKey.json
```

---

## Tech Stack

| Component     | Details                                          |
|---------------|--------------------------------------------------|
| Runtime       | Node.js (tested on v18+)                         |
| Framework     | Express 4.21                                     |
| Database      | SQLite 3 (file: `./database.db`)                 |
| Push Notifs   | Firebase Admin SDK 13.x (FCM)                    |
| HTTP Client   | Axios 1.10                                       |
| Deployment    | Render (backend), DigitalOcean VPS (vps.js)      |

**Unused but installed:** `bcryptjs`, `jsonwebtoken`, `uuid`, `dotenv` (dotenv is commented out in app.js)

---

## Feature Breakdown

### Smart Pill Dispenser

**What it does:**
- Schedules medication dispenses (time + pill slot)
- Arduino hardware polls VPS for schedules, dispenses pills at scheduled times
- Records dispense confirmations and sends FCM push notifications to the tablet
- Handles device errors (cup not in place, motor stuck, battery low)

**Key files:**
| File | Purpose |
|------|---------|
| `routes/pill.routes.js` | Route definitions for `/api/pill/*` |
| `services/pill.service.js` | Core logic: CRUD schedules, FCM notifications, device registration |
| `services/vps.js` | **Deployed separately on DigitalOcean VPS** — proxy between backend and Arduino |
| `firebaseInit.js` | Initializes Firebase Admin SDK for push notifications |

**External integrations:**
- **DigitalOcean VPS:** `vps.js` runs on `128.199.7.31:3000` as `server.js`. Backend pushes to:
  - `POST http://128.199.7.31:3000/api/send-schedule` — queue schedules for Arduino
  - `POST http://128.199.7.31:3000/api/send-delete` — queue deletions for Arduino
- **Firebase Cloud Messaging:** Sends notifications when pills dispense or errors occur
- **Arduino hardware:** Long-polls VPS at `/api/wait-for-schedule`, reports to `/api/pill-dispensed` and `/api/device-error`

**Hardware contact:** Eric (joining on hardware side)

---

### Smart Cooking Assistant

**What it does:**
- Provides recipe list with ingredients and step-by-step instructions
- Tracks current cooking state (which recipe, which step)
- Syncs step progress with stove IoT device (device sends step messages, backend records current step)

**Key files:**
| File | Purpose |
|------|---------|
| `routes/pot.routes.js` | Route definitions for `/api/pot/*` |
| `services/pot.service.js` | Recipe retrieval, current step CRUD |
| `initialRecipeData.js` | Hardcoded recipe data (Chicken Teriyaki with 6 steps) |

**External integrations:**
- **Stove IoT device:** Sends step instructions as messages to `POST /api/pot/current-recipe`. The `message` field matches step instructions to determine current step.
- No video/media handling currently implemented.

**Note:** The root routes in `app.js` (`/recipe`, `/step`) reference `recipes` and `steps` tables that are **not created** in `seed.js`. These routes will error. Use `/api/pot/recipe` instead which uses hardcoded data.

---

## Environment Variables

| Variable | Feature | Purpose | Example |
|----------|---------|---------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Pillbox | Firebase Admin SDK credentials (JSON string) | `{"type":"service_account",...}` |

**Note:** `dotenv` is installed but the `require('dotenv').config()` line is commented out in `app.js`. Enable it if using a `.env` file locally.

See `.env.example` for a template.

---

## Database

**Engine:** SQLite 3
**File location:** `./database.db` (project root)
**Schema creation:** Runs automatically via `npm start` (executes `seed.js` first)

**Warning:** `seed.js` runs `DROP TABLE IF EXISTS` then recreates tables on every startup. This **wipes all data**. For production, you'll want to remove the DROP statements or use a proper migration system.

### Tables

| Table | Feature | Purpose |
|-------|---------|---------|
| `pillSchedule` | Pillbox | Stores scheduled pill dispenses per device |
| `pillDeviceTokens` | Pillbox | FCM tokens for push notifications per device |
| `pot` | Cooking | Current recipe state (single row: recipe_id + current_step) |
| `motion` | Shared | Motion sensor events (room_id, event_type, timestamp) |

See `schema.sql` for full CREATE TABLE statements.

---

## How to Run Locally

### 1. Prerequisites
- Node.js 18+ installed
- Firebase project with service account credentials

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment
```bash
cp .env.example .env
# Edit .env and add your Firebase service account JSON
```

Uncomment this line in `app.js`:
```js
// require('dotenv').config();
```
→ Change to:
```js
require('dotenv').config();
```

### 4. Start the server
```bash
npm start
```
This runs `node seed.js && node app.js`, creating the database schema then starting Express on port 3000.

### 5. Test
```bash
curl http://localhost:3000/api/pot/recipe
```

### Feature independence
Both features run together on the same server. They share the Express instance and database file but use separate routes and tables. You cannot disable one feature independently without modifying code.

---

## API Endpoint Summary

### Pillbox (`/api/pill/*`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pill/schedule` | Add pill schedule(s) for a device |
| GET | `/api/pill/schedule` | Get all schedules for a device (X-Device-ID header) |
| DELETE | `/api/pill/schedule/:pillId` | Delete a specific pill schedule |
| POST | `/api/pill/dispensed` | Record pill dispensed (called by VPS) |
| POST | `/api/pill/register-device` | Register FCM token for push notifications |
| GET | `/api/pill/register-device` | List all registered device tokens |
| POST | `/api/pill/device-error` | Handle device error (called by VPS) |

### Cooking (`/api/pot/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pot/recipe` | Get all recipes (hardcoded data) |
| GET | `/api/pot/current-recipe` | Get current cooking state |
| POST | `/api/pot/current-recipe` | Start cooking (set current recipe/step from message) |
| PUT | `/api/pot/current-recipe` | Update current step |
| DELETE | `/api/pot/current-recipe` | Clear current cooking state |

### Shared (root routes in `app.js`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/motion` | Record motion sensor event |
| GET | `/motion` | Get all motion events |
| DELETE | `/motion-RESET` | Clear motion events (testing) |
| POST | `/recipe` | Create recipe (broken — table doesn't exist) |
| GET | `/recipe` | Get recipe by ID (broken — table doesn't exist) |
| DELETE | `/recipe` | Delete all recipes (broken — table doesn't exist) |
| POST | `/step` | Create step (broken — table doesn't exist) |
| GET | `/step` | Get step (broken — table doesn't exist) |

---

## Key Files to Know

### Pillbox — Start Here

1. **`services/pill.service.js`** — Core business logic. Read this first to understand scheduling, dispensing, and notifications.
2. **`services/vps.js`** — The VPS proxy that bridges backend ↔ Arduino. Deploy this separately on DigitalOcean.
3. **`firebaseInit.js`** — Firebase setup. You'll need to create your own Firebase project and service account.
4. **`routes/pill.routes.js`** — All Pillbox endpoints in one place.

### Cooking — Start Here

1. **`services/pot.service.js`** — Recipe retrieval and step tracking logic.
2. **`initialRecipeData.js`** — Hardcoded recipe data. Add new recipes here or migrate to database storage.
3. **`routes/pot.routes.js`** — All Cooking endpoints in one place.

### Shared

1. **`app.js`** — Server entry point, middleware setup, route mounting.
2. **`seed.js`** — Database schema creation. Modify this to add new tables or change schema.

---

## Deployment

### Render (Main Backend)

The backend is deployed on Render at `https://androidsupportivehousing.onrender.com`.

**Important for handoff:**
- Render services **cannot be transferred** between accounts
- You must create your own Render account and redeploy
- Add the `FIREBASE_SERVICE_ACCOUNT` environment variable in Render dashboard

**SQLite + Render caveat:**
Render uses an ephemeral filesystem. The `database.db` file will be wiped on each deploy or restart. To persist data:
1. Add a **Render Disk** to your service
2. Update `database/database.js` to use the disk path (e.g., `/var/data/database.db`)

### DigitalOcean VPS (Pillbox Only)

The `services/vps.js` file runs separately on a DigitalOcean droplet (`128.199.7.31:3000`).

**To redeploy:**
1. Create a DigitalOcean droplet (Ubuntu recommended)
2. Install Node.js
3. Copy `vps.js` to the server as `server.js`
4. Update the `BACKEND_URL` constant in the file to point to your Render URL
5. Run with PM2 or systemd: `pm2 start server.js`
6. Update the hardcoded VPS IP in `services/pill.service.js` (lines 47, 82)

### Single Deployment Serves Both Features

The same Render deployment serves both Pillbox and Cooking. There's no need for separate deployments unless you want to split them.

---

## Known Issues / TODOs

1. **Schema bug:** Routes in `app.js` reference `recipes` and `steps` tables that don't exist in `seed.js`. Either add them to seed.js or remove the dead routes.

2. **Data wipes on restart:** `seed.js` drops and recreates all tables. For production, remove the `DROP TABLE` statements.

3. **Hardcoded IPs:** VPS IP `128.199.7.31` is hardcoded in `pill.service.js`. Move to environment variable.

4. **Dotenv disabled:** Uncomment `require('dotenv').config()` in `app.js` to enable `.env` loading.

5. **Unused dependencies:** `bcryptjs`, `jsonwebtoken`, `uuid` are installed but not used. Can be removed.

---

## Contact

- **Pillbox Hardware:** Eric
- **Previous maintainer:** (add your contact info here before handoff)
