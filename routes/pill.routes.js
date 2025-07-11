const express = require('express');
const router = express.Router();
const pillService = require('../services/pill.service');
const db = require('../database/database');

router.post('/schedule', pillService.addPillSchedule);
router.get('/schedule', pillService.getPillSchedule);
router.delete('/schedule/:pillId', pillService.deleteAllPillSchedules)
router.post('/dispensed',pillService.addPillDispensed)
router.post('/register-device',pillService.registerDeviceToken)
router.get('/register-device',pillService.getDeviceTokens)

//Post pill event
// router.post('/pill-history', (req, res) => {
//     const { pill_id, event_type } = req.body;
//     db.run(`INSERT INTO pillHistory (pill_id, event_type) VALUES (?, ?)`, [pill_id, event_type], function(err) {
//         if (err) {
//             res.status(400).json({ error: err.message });
//         } else {
//             const now = new Date().toISOString()
//             res.json({ pill_id: pill_id, event_type: event_type, created_at: now });
//         }
//     });
// });

//Get all pill events
router.get('/history', (req, res) => {
    db.all(`SELECT * FROM pillHistory`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
});

router.delete('/pill-schedule', (req, res) => {
    const { pill_id, dispense_time } = req.body;
    db.run(`DELETE FROM pillSchedule WHERE pill_id = ? AND dispense_time = ?`, [pill_id, dispense_time], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ pill_id: pill_id, dispense_time: dispense_time });
        }
    });
});

//Delete all for testing
router.delete('/pill-RESET', (req, res) => {
    db.run("DELETE FROM pill", (err) => { 
        if (err) {
            res.status(500).json({ error: err.message }); 
        } else {
            res.status(200).json({ message: 'Deleted successfully.' }); 
        }
    });
});
module.exports = router;