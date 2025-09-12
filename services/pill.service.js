const { Pool } = require('pg');
const admin = require('../firebaseInit');
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.registerDeviceToken = async (req, res) => {
  console.log("registering", req.body);
  const { device_id, fcm_token, device_type } = req.body;
  if (!device_id || !fcm_token || device_type == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await pool.query(
      `INSERT INTO pillDeviceTokens (device_id, fcm_token, device_type) VALUES ($1, $2, $3) ON CONFLICT (device_id) DO UPDATE SET fcm_token = EXCLUDED.fcm_token, device_type = EXCLUDED.device_type`,
      [device_id, fcm_token, Number(device_type)]
    );
    res.status(200).json({ message: 'Device token added successfully' });
  } catch (err) {
    console.error('DB Insert Error:', err.message);
    res.status(500).json({ error: 'Failed to save token' });
  }
};

exports.getDeviceTokens = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM pillDeviceTokens`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePillSchedule = async (req, res) => {
  const deviceId = req.header('X-Device-ID');
  const { pillId } = req.params;

  if (!pillId) {
    return res.status(400).json({ error: "No Pill ID found" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM pillSchedule WHERE pill_id = $1`,
      [Number(pillId)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No schedule found with that pill_id" });
    }

    res.json({ message: "Pill schedule deleted successfully" });

    try {
      await axios.post('http://128.199.7.31:3000/api/send-delete', {
        deviceId,
        deletes: [pillId]
      });
    } catch (vpsErr) {
      console.error("Failed to notify VPS of delete:", vpsErr.message);
    }
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Failed to delete pill schedule" });
  }
};

exports.addPillSchedule = async (req, res) => {
  console.log("adding schedule");
  const deviceId = req.header('X-Device-ID');
  const { schedules } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "Missing device ID" });
  }
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: "Missing or empty schedules" });
  }

  const payloadToSend = schedules.map(timestamp => ({
    pill_id: timestamp.pill_id,
    dispense_time: formatTimestamp12Hour(timestamp.dispense_time),
    pill_slot: timestamp.pill_slot
  }));

  try {
    await axios.post('http://128.199.7.31:3000/api/send-schedule', {
      deviceId,
      schedules: payloadToSend
    });
  } catch (err) {
    console.error("Failed to send to VPS:", err.message);
  }

  try {
    const insertPromises = schedules.map(entry =>
      pool.query(
        `INSERT INTO pillSchedule (device_id, pill_id, dispense_time, pill_slot) VALUES ($1, $2, $3, $4)`,
        [deviceId, Number(entry.pill_id), Number(entry.dispense_time), Number(entry.pill_slot)]
      )
    );

    await Promise.all(insertPromises);

    res.status(200).json({ message: 'Pill schedule added successfully' });
  } catch (err) {
    console.error("Insert error:", err.message);
    res.status(500).json({ error: "Failed to add pill schedule" });
  }
};

exports.getPillSchedule = async (req, res) => {
  const deviceId = req.header('X-Device-ID');
  if (!deviceId) {
    return res.status(400).json({ error: 'Missing device ID' });
  }

  try {
    const result = await pool.query(
      `SELECT dispense_time, pill_id, is_dispensed, pill_slot FROM pillSchedule WHERE device_id = $1`,
      [deviceId]
    );

    const formatted = result.rows
      .map(row => ({
        dispense_time: row.dispense_time,
        pill_id: row.pill_id,
        is_dispensed: row.is_dispensed,
        pill_slot: row.pill_slot
      }))
      .sort((a, b) => a.dispense_time - b.dispense_time);

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPillDispensed = async (req, res) => {
  const { device_id, pill_id, dispense_time } = req.body;

  if (!pill_id || !dispense_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `UPDATE pillSchedule
       SET is_dispensed = true,
           dispensed_at = CURRENT_TIMESTAMP
       WHERE pill_id = $1`,
      [Number(pill_id)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No schedule found for given pill_id' });
    }

    console.log(`Pill dispensed: ${pill_id} by device ${device_id}`);

    const message = {
      token: "",
      notification: {
        title: 'Pill Dispensed',
        body: `Pill was dispensed at ${dispense_time}`,
      },
      data: {
        pill_id: String(pill_id),
        dispense_time: String(dispense_time),
        device_id: String(device_id),
      },
    };

    await sendPushNotificationToUser(device_id, message);

    res.status(200).json({ message: 'Pill dispensed recorded successfully' });
  } catch (err) {
    console.error('Error saving dispensation:', err.message);
    res.status(500).json({ error: 'Failed to record pill dispensation' });
  }
};

async function sendPushNotificationToUser(deviceId, message) {
  try {
    const result = await pool.query(`SELECT * FROM pillDeviceTokens WHERE device_id = $1`, [deviceId]);

    if (result.rows.length === 0 || !result.rows[0].fcm_token) {
      console.warn(`No FCM token found for device ${deviceId}`);
      return;
    }

    message.token = result.rows[0].fcm_token;

    await admin.messaging().send(message);
    console.log(`Notification sent for device ${deviceId}`);
  } catch (err) {
    console.error("FCM Error:", err.message);
  }
}

exports.handleDeviceError = async (req, res) => {
  const { device_id, error } = req.body;

  if (!device_id || !error) {
    return res.status(400).json({ error: 'Missing device_id or error' });
  }

  console.log(`Error received from ${device_id}: ${error}`);

  let title = 'Device Error';
  let body = error;

  switch (error.toLowerCase()) {
    case 'cup not in place':
      title = 'Cup Not In Place';
      body = 'Please place the cup correctly for dispensing.';
      break;
    case 'motor stuck':
      title = 'Motor Stuck';
      body = 'Dispensing motor is stuck. Manual check required.';
      break;
    case 'battery low':
      title = 'Low Battery';
      body = 'Device battery is low. Please recharge.';
      break;
    default:
      title = 'Device Alert';
      body = error;
      break;
  }

  const message = {
    token: "",
    notification: { title, body },
    data: {
      error: String(error),
      device_id: String(device_id),
    },
  };

  await sendPushNotificationToUser(device_id, message);
  res.status(200).json({ message: 'Device error recorded successfully' });
};

function formatTimestamp12Hour(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}; ${formattedHours}:${minutes}; ${ampm}`;
}
