// notification-service/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { sendEmail, sendSMS, sendPushNotification } = require('../services/notificationService');

// Endpoint to manually trigger a notification
router.post('/send-notification', (req, res) => {
  const { type, trackingNumber, deliveryStatus } = req.body;

  // Create a mock delivery status update
  const deliveryStatusUpdate = {
    trackingNumber,
    deliveryStatus,
  };

  switch (type) {
    case 'email':
      sendEmail(deliveryStatusUpdate);
      break;
    case 'sms':
      sendSMS(deliveryStatusUpdate);
      break;
    case 'push':
      sendPushNotification(deliveryStatusUpdate);
      break;
    default:
      return res.status(400).json({ message: 'Invalid notification type' });
  }

  res.status(200).json({ message: `Notification sent via ${type}` });
});

module.exports = router;
