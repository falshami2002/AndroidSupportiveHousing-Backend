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