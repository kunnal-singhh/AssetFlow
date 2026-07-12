const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// Developer 2: Map routes to asset controller methods.
router.get('/', assetController.getAssets);
router.post('/', assetController.createAsset);
router.patch('/:id/status', assetController.updateAssetStatus);
router.post('/:id/allocate', assetController.allocateAsset);

module.exports = router;
