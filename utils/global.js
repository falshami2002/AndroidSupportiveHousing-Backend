const pendingClients = {};   // deviceId → [response, ...]
const scheduleQueue = {};    // deviceId → [schedule, ...]

module.exports = { pendingClients, scheduleQueue };