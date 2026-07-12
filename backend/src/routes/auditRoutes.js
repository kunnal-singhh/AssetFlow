const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

// Developer 3: Map routes to audit controller methods.
router.get('/', auditController.getAudits);
router.post('/', auditController.createAuditCycle);
router.post('/:cycleId/items/:itemId/verify', auditController.verifyAuditLineItem);

module.exports = router;
