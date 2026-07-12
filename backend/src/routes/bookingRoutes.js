const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Developer 4: Map routes to booking/maintenance methods.
router.post('/', bookingController.createBooking);
router.patch('/:id/status', bookingController.updateBookingStatus);

router.post('/maintenance', bookingController.createMaintenanceRequest);
router.get('/maintenance', bookingController.getMaintenanceRequests);

module.exports = router;
