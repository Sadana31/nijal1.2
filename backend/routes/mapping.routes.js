const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mapping.controller');

router.post('/irmToSB', mappingController.mapSBsToIRM);

router.post('/sbToIRM', mappingController.mapIRMsToSB);

router.get('/history/sb/:sbNo', mappingController.getMappingHistoryBySB);

router.get('/history/irm/:refNo', mappingController.getMappingHistoryByIRM);

router.get('/all', mappingController.getAllMappings);

module.exports = router;
