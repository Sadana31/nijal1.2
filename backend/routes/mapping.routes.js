const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mapping.controller');

// ✅ One IRM → Multiple SBs
router.post('/irmToSB', mappingController.mapSBsToIRM);

// ✅ One SB → Multiple IRMs
router.post('/sbToIRM', mappingController.mapIRMsToSB);

module.exports = router;
