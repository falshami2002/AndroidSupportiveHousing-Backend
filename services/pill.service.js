const db = require('../database/database');
const admin = require('../firebaseInit');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
// const { pendingClients, scheduleQueue } = require('../utils/global');

exports.registerDeviceToken = async (req, res) => {
    const { device_id, fcm_token, device_type } = req.body;
    if (device_id == null || !fcm_token || !device_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await db.run(`INSERT INTO pillDeviceTokens (device_id, fcm_token, device_type) VALUES (?, ?, ?)`, [device_id, fcm_token, device_type]);
        res.status(200).json({ message: 'Device token added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save token' });
    }
}

exports.getDeviceTokens = (req, res) => {
    db.all(`SELECT * FROM pillDeviceTokens`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
}

exports.deletePillSchedule = async (req, res) => {
    const deviceId = req.header('X-Device-ID');
    const { pillId } = req.params;
    if(pillId){
        console.log("pill id found");
        db.run(`DELETE FROM pillSchedule WHERE pill_id = ?`, [pillId], function(err) {
            if (err) {
                console.error("DB error:", err.message);
                return res.status(500).json({ error: "Failed to delete pill schedule" });
            }
    
            if (this.changes === 0) {
                return res.status(404).json({ message: "No schedule found with that pill_id" });
            }
    
            res.json({ message: "Pill schedule deleted successfully" });
        });
        try {
            await axios.post('http://128.199.7.31:3000/api/send-delete', {
                deviceId,
                deletes: [pillId]
            });
        } catch (vpsErr) {
            console.error("Failed to notify VPS of delete:", vpsErr.message);
        }
    }
    else{
        console.log("no pill id found")
        return res.status(400).json({ error: "No Pill ID found" });
        // db.run(`DELETE FROM pillSchedule`, function (err) {
        //     if (err) {
        //         return res.status(500).json({ error: err.message });
        //     }
        //     res.json({ message: 'All pill schedules deleted successfully' });
        // });
    }
};

exports.addPillSchedule = async (req, res) => {
    const deviceId = req.header('X-Device-ID');  
    const { schedules } = req.body;
    console.log("params",deviceId,schedules)
    if (!deviceId || deviceId == null) {
        return res.status(400).json({ error: "Missing device ID" });
    }
    if (!Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ error: "Missing or empty schedules" });
    }

    const payloadToSend = schedules.map(timestamp =>  ({pill_id: timestamp.pill_id, dispense_time: formatTimestamp12Hour(timestamp.dispense_time), pill_slot: timestamp.pill_slot}));

        console.log("payload to send",payloadToSend)

    // Forward to VPS proxy
    try {
        await axios.post('http://128.199.7.31:3000/api/send-schedule', {
            deviceId,
            schedules: payloadToSend
        });
        // res.send("Schedule forwarded to hardware");
    } catch (err) {
        console.error("Failed to send to VPS:", err.message);
        // res.status(500).send("Could not forward schedule");
    }
    const insertStmt = db.prepare(
        `INSERT INTO pillSchedule (device_id, pill_id, dispense_time, pill_slot) VALUES (?, ?, ?, ?)`
    );

    // Insert all entries one by one
    db.serialize(() => {
        schedules.forEach(entry => {
            insertStmt.run([deviceId, entry.pill_id, entry.dispense_time, entry.pill_slot], err => {
                if (err) {
                    console.error("Error inserting entry:", err.message);
                }
            });
        });

        insertStmt.finalize(err => {
            if (err) {
                return res.status(500).json({ error: "Failed to finalize insert" });
            }

            res.status(200).json({ message: 'Pill schedule added successfully' });
        });
    });
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
exports.getPillSchedule = (req, res) => {
    const deviceId = req.header('X-Device-ID');
    if (deviceId == null) {
        return res.status(400).json({ error: 'Missing device ID' });
    }

    const query = `
        SELECT dispense_time, pill_id, is_dispensed, pill_slot 
        FROM pillSchedule 
        WHERE device_id = ?
    `;

    db.all(query, [deviceId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log("getting all",rows)

        const formatted = rows.map(row => ({
            dispense_time: row.dispense_time,
            pill_id: row.pill_id,
            is_dispensed: row.is_dispensed,
            pill_slot: row.pill_slot
        })).sort((a, b) => a.dispense_time - b.dispense_time);

        res.json(formatted);
    });
}

// exports.sendSchedulesToHardware = (req, res) => {
//     const deviceId = req.header('X-Device-ID');
//     if (!deviceId) return res.status(400).json({ error: 'Missing X-Device-ID' });

//     // If there are already schedules pending, send them immediately
//     if (scheduleQueue[deviceId] && scheduleQueue[deviceId].length > 0) {
//         const pending = scheduleQueue[deviceId];
//         scheduleQueue[deviceId] = [];  // clear after sending
//         return res.json({ schedules: pending });
//     }

//     // Else: store this client response to notify later
//     if (!pendingClients[deviceId]) pendingClients[deviceId] = [];
//     pendingClients[deviceId].push(res);

//     // Timeout after 30s if nothing posted
//     setTimeout(() => {
//         const index = pendingClients[deviceId]?.indexOf(res);
//         if (index !== -1) {
//             pendingClients[deviceId].splice(index, 1);
//             res.json({ schedules: [] });  // send empty
//         }
//     }, 30000);
// }



exports.addPillDispensed = async (req, res) => {
  const deviceId = req.header('X-Device-ID');
  const { pill_id, dispense_time, event_type } = req.body;

  if (!deviceId || !pill_id || !dispense_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.run(`
      INSERT INTO pillHistory (device_id, pill_id, dispense_time, event_type)
      VALUES (?, ?, ?, ?)
    `, [deviceId, pill_id, dispense_time, event_type || 'auto']);

    console.log(`Pill dispensed: ${pill_id} by device ${deviceId}`);

    // Send push notification to the user
    await sendPushNotificationToUser(deviceId, pill_id, dispense_time);

    res.status(200).json({ message: 'Pill dispensed recorded successfully' });
  } catch (err) {
    console.error('Error saving dispensation:', err);
    res.status(500).json({ error: 'Failed to record pill dispensation' });
  }
}

async function sendPushNotificationToUser(deviceId, pill_id, dispense_time) {
    db.get(`SELECT * FROM pillDeviceTokens WHERE device_id = ?`,[deviceId],(err, row) => 
        {
            if (err) {
                console.error("DB Error:", err);
                return;
            }
            if (!row || !row.fcm_token) {
                console.warn(`No FCM token found for device ${deviceId}`);
                console.log("FCM token not found for device" );
            }

            const message = {
                token: row.fcm_token,
                notification: {
                    title: 'Pill Dispensed',
                    body: `${pill_id} was dispensed at ${dispense_time}`,
                },
                data: {
                    pill_id: String(pill_id),
                    dispense_time: String(dispense_time),
                    device_id: String(deviceId),
                },
            };

            // Send push notification
            admin
                .messaging()
                .send(message)
                .then((response) => {
                    console.log(`Notification sent: ${response}`);
                    
                })
                .catch((error) => {
                    console.error("FCM Error:", error);
                    
                });
        }
    );
}