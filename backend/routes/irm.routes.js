const express = require('express');
const router = express.Router();
const controller = require('../controllers/irm.controller');

router.use((req, res, next) => {
  console.log(`[IRM ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});


router.get('/', controller.getAllIRM);
router.post('/add', controller.createIRM);

router.post('/bulk_add', controller.createIRMInBulk);  // Correct order + name
router.get('/:id', controller.getIRMById);
router.put('/update/:id', controller.updateIRM);

module.exports = router;
