const express = require('express');
const router = express.Router();
const controller = require('../controllers/sb.controller');

router.get('/', controller.getAllSB);
router.post('/add', controller.createSB);
router.post('/bulk_add', controller.createSBInBulk); // ✅ Bulk upload route
router.get('/:id', controller.getSBById);
router.put('/update/:id', controller.updateSB);

module.exports = router;