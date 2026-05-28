-- =============================================================================
-- Supportive Housing Backend - Database Schema
-- =============================================================================
-- SQLite 3 schema extracted from seed.js
-- Run: sqlite3 database.db < schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PILLBOX FEATURE: Pill schedule storage
-- -----------------------------------------------------------------------------
-- Stores scheduled medication dispenses per device
-- Used by: pill.service.js
--
CREATE TABLE IF NOT EXISTS pillSchedule (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,              -- Arduino device identifier
    pill_id INTEGER NOT NULL,             -- Unique pill schedule ID from app
    pill_slot INTEGER,                    -- Physical slot number on dispenser
    dispense_time INTEGER NOT NULL,       -- Unix timestamp (milliseconds) for dispense
    is_dispensed BOOLEAN DEFAULT 0,       -- 1 = dispensed, 0 = pending
    dispensed_at DATETIME DEFAULT NULL,   -- Timestamp when actually dispensed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- PILLBOX FEATURE: FCM device tokens
-- -----------------------------------------------------------------------------
-- Stores Firebase Cloud Messaging tokens for push notifications
-- Used by: pill.service.js
--
CREATE TABLE IF NOT EXISTS pillDeviceTokens (
    device_id TEXT PRIMARY KEY,           -- Arduino device identifier
    fcm_token TEXT NOT NULL,              -- Firebase Cloud Messaging token
    device_type INTEGER NOT NULL          -- Device type identifier
);

-- -----------------------------------------------------------------------------
-- COOKING FEATURE: Current recipe state
-- -----------------------------------------------------------------------------
-- Tracks which recipe is being cooked and current step
-- Single row table (only one recipe cooking at a time)
-- Used by: pot.service.js
--
CREATE TABLE IF NOT EXISTS pot (
    recipe_id INTEGER PRIMARY KEY,        -- ID of recipe being cooked
    current_step INTEGER                  -- Current step number (1-indexed)
);

-- -----------------------------------------------------------------------------
-- SHARED: Motion sensor events
-- -----------------------------------------------------------------------------
-- Records motion sensor events from IoT devices
-- Used by: app.js root routes
--
CREATE TABLE IF NOT EXISTS motion (
    room_id INTEGER,                      -- Room identifier
    event_type TEXT,                      -- Type of motion event
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- NOTE: The following tables are referenced in app.js but NOT created by seed.js
-- The routes using these tables will error. Uncomment if you need them.
-- =============================================================================

-- CREATE TABLE IF NOT EXISTS recipes (
--     id INTEGER PRIMARY KEY,
--     name TEXT NOT NULL,
--     estimated_time INTEGER,
--     ingredients TEXT                   -- JSON string of ingredients
-- );

-- CREATE TABLE IF NOT EXISTS steps (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     recipe_id INTEGER NOT NULL,
--     step_order INTEGER NOT NULL,
--     name TEXT,
--     duration INTEGER,
--     instructions TEXT,
--     input TEXT,
--     output TEXT,
--     FOREIGN KEY (recipe_id) REFERENCES recipes(id)
-- );
