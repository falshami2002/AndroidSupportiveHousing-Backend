const express = require('express');
const app = express();
const axios = require('axios');
app.use(express.json());

const BACKEND_URL = 'https://androidsupportivehousing.onrender.com';

const scheduleQueueMap = {};             // { deviceId: [schedule1, schedule2, ...] }
const deleteQueueMap = {};               // { deviceId: [pillId1, pillId2, ...] }

const pendingCombinedResponses = {};     // { deviceId: { res, timeout } }

// ========== SCHEDULE HANDLER ==========

// BE → VPS: Send schedule(s)
app.post('/api/send-schedule', (req, res) => {
  const { deviceId, schedules } = req.body;

  if (!deviceId || deviceId == null || !Array.isArray(schedules)) {
    return res.status(400).json({ error: 'Missing deviceId or schedules' });
  }

  if (!scheduleQueueMap[deviceId]) scheduleQueueMap[deviceId] = [];
  scheduleQueueMap[deviceId].push(...schedules);

  if (pendingCombinedResponses[deviceId]) {
    const response = pendingCombinedResponses[deviceId];
    response.res.json({
      schedules: scheduleQueueMap[deviceId],
      deletes: deleteQueueMap[deviceId] || []
    });

    clearTimeout(response.timeout);
    delete pendingCombinedResponses[deviceId];
    scheduleQueueMap[deviceId] = [];
    deleteQueueMap[deviceId] = [];
  }

  res.send('Schedules queued');
});

// ========== DELETE HANDLER ==========

// BE → VPS: Send delete request(s)
app.post('/api/send-delete', (req, res) => {
    const { deviceId, deletes } = req.body;
  
    if (!deviceId || deviceId == null || !Array.isArray(deletes)) {
      return res.status(400).json({ error: 'Missing deviceId or deletes' });
    }
  
    if (!deleteQueueMap[deviceId]) deleteQueueMap[deviceId] = [];
    deleteQueueMap[deviceId].push(...deletes);
  
    if (pendingCombinedResponses[deviceId]) {
      const response = pendingCombinedResponses[deviceId];
      response.res.json({
        schedules: scheduleQueueMap[deviceId] || [],
        deletes: deleteQueueMap[deviceId]
      });
  
      clearTimeout(response.timeout);
      delete pendingCombinedResponses[deviceId];
      scheduleQueueMap[deviceId] = [];
      deleteQueueMap[deviceId] = [];
    }
  
    res.send('Delete requests queued');
});

// Arduino → VPS: Wait for schedule(s) and delete(s)
app.get('/api/wait-for-schedule', (req, res) => {
  const deviceId = req.query.deviceId;
  if (!deviceId || deviceId == null) return res.status(400).json({ error: 'Missing deviceId in query' });

  console.log(`Arduino long polling for schedules: ${deviceId}`);

  const schedules = scheduleQueueMap[deviceId] || [];
  const deletes = deleteQueueMap[deviceId] || [];

  if (schedules.length > 0 || deletes.length > 0) {
    res.json({ schedules, deletes });

    // Clear queues
    scheduleQueueMap[deviceId] = [];
    deleteQueueMap[deviceId] = [];
  } else {
    // No updates, wait up to 30 seconds
    const timeout = setTimeout(() => {
      if (pendingCombinedResponses[deviceId]) {
        pendingCombinedResponses[deviceId].res.status(204).end(); // No Content
        delete pendingCombinedResponses[deviceId];
      }
    }, 30000);

    pendingCombinedResponses[deviceId] = { res, timeout };
  }
});

// Arduino → VPS → BE: Pill Dispensed
app.post('/api/pill-dispensed', async (req, res) => {
    const { device_id, pill_id, dispense_time } = req.body;

    if (!device_id || !pill_id) {
      return res.status(400).json({ error: 'Missing device_id or pill_id' });
    }

    console.log(`Received pill dispensed from device ${device_id} for pill ${pill_id}`);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/pill/dispensed`, {
        device_id,
        dispense_time,
        pill_id
      });

      res.status(200).json({ message: 'Forwarded to backend', backendResponse: response.data });
    } catch (err) {
      console.error('Error forwarding to backend:', err.message);
      res.status(500).json({ error: 'Failed to forward to backend' });
    }
  });

    // Called by Arduino when device has an error
    app.post('/api/device-error', async (req, res) => {
        const { device_id, error } = req.body;

        if (!device_id || !error) {
        return res.status(400).json({ error: 'Missing device_id or error message' });
        }
        console.log(`Device Error reported from ${device_id}: ${error}`);

        try {
                // Forward to backend
                await axios.post(`${BACKEND_URL}/api/pill/device-error`, {
                        device_id,
                        error
                });
                res.status(200).json({ message: 'Error forwarded to backend' });
        } catch (err) {
                console.error('Failed to forward error to BE:', err.message);
                res.status(500).json({ error: 'Failed to forward to backend' });
        }
    });

// Start VPS Server
app.listen(3000, () => console.log("VPS proxy server listening on port 3000"));