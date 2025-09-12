const express = require('express');
const router = express.Router();
const pillService = require('../services/pill.service');

router.post('/schedule', pillService.addPillSchedule); //fe to be
router.get('/schedule', pillService.getPillSchedule); //fe to be
router.delete('/schedule/:pillId', pillService.deletePillSchedule) //fe to be
router.post('/dispensed',pillService.addPillDispensed) // vps to be
router.post('/register-device',pillService.registerDeviceToken) //fe to bes
router.get('/register-device',pillService.getDeviceTokens)
router.post('/device-error',pillService.handleDeviceError) //vps to be

module.exports = router;