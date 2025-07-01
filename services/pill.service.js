const db = require('../database/database');

exports.addPillSchedule = (req, res) => {
    console.log("in routeX")
    const deviceId = req.header('X-Device-ID');  
    const { pill_id, dispense_time } = req.body;
    console.log("all data",deviceId,pill_id,dispense_time)
    if (!deviceId) {
        return res.status(400).json({ error: "Missing device ID" });
    }
    
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