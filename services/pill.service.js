const db = require('../database/database');
const { pendingClients, scheduleQueue } = require('../utils/global');

exports.addPillSchedule = (req, res) => {
    console.log("in routeX")
    const deviceId = req.header('X-Device-ID');  
    const { pill_id, dispense_time } = req.body;
    console.log("all data",deviceId,pill_id,dispense_time)
    if (!deviceId) {
        return res.status(400).json({ error: "Missing device ID" });
    }

    // Save to in-memory queue
    if (!scheduleQueue[deviceId]) scheduleQueue[deviceId] = [];
    scheduleQueue[deviceId].push(schedule);

    // Respond to all waiting Arduino clients (long-polling)
    const clients = pendingClients[deviceId] || [];
    while (clients.length > 0) {
        const resClient = clients.shift();
        resClient.json({ schedules: [...scheduleQueue[deviceId]] });  // Send full list
    }

    // Clear after notifying
    scheduleQueue[deviceId] = [];

    db.run(`INSERT INTO pillSchedule (device_id, pill_id, dispense_time) VALUES (?, ?, ?)`, [deviceId ,pill_id, dispense_time], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ pill_id, dispense_time });
        }
    });
};

exports.getPillSchedule = (req, res) => {
    db.all(`SELECT * FROM pillSchedule`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
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

exports.sendSchedulesToHardware = (req, res) => {
    const deviceId = req.header('X-Device-ID');
    if (!deviceId) return res.status(400).json({ error: 'Missing X-Device-ID' });

    // If there are already schedules pending, send them immediately
    if (scheduleQueue[deviceId] && scheduleQueue[deviceId].length > 0) {
        const pending = scheduleQueue[deviceId];
        scheduleQueue[deviceId] = [];  // clear after sending
        return res.json({ schedules: pending });
    }

    // Else: store this client response to notify later
    if (!pendingClients[deviceId]) pendingClients[deviceId] = [];
    pendingClients[deviceId].push(res);

    // Timeout after 30s if nothing posted
    setTimeout(() => {
        const index = pendingClients[deviceId]?.indexOf(res);
        if (index !== -1) {
            pendingClients[deviceId].splice(index, 1);
            res.json({ schedules: [] });  // send empty
        }
    }, 30000);
}

exports.registerDeviceToken = async (req, res) => {
    const { device_id, fcm_token } = req.body;
    if (!device_id || !fcm_token) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        await db.run(`INSERT INTO pillDeviceTokens (device_id, fcm_token) VALUES (?, ?)`, [device_id, fcm_token]);
        res.status(200).json({ message: 'Pill token added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save token' });
    }
}

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
  const user = await db.get(
    `SELECT * FROM pillDeviceTokens WHERE device_id = ?`,
    [deviceId]
  );
  console.log("fcm from table",user)
  db.all(`SELECT * FROM pillDeviceTokens`, (err, values) => {
        if (err) {
            // res.status(500).json({ error: err.message });
            console.log("Err here her here")
        } else {
            // res.json(values);
            console.log("from test",values)
        }
    });
  if (!user?.fcm_token) {
    console.warn(`No FCM token for device ${deviceId}`);
    return;
  }


//   const notification = {
//     to: user.fcm_token,
//     notification: {
//       title: `Pill Dispensed`,
//       body: `${pill_id} was dispensed at ${dispense_time}`,
//     },
//     data: {
//       pill_id,
//       dispense_time,
//       device_id: deviceId,
//     }
//   };

//   try {
//     await axios.post('https://fcm.googleapis.com/fcm/send', notification, {
//       headers: {
//         'Authorization': `key=${FCM_SERVER_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log(`Notification sent to user for device ${deviceId}`);
//   } catch (error) {
//     console.error('FCM error:', error.response?.data || error.message);
//   }
}