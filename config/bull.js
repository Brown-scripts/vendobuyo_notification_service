const Queue = require('bull');
const { sendEmail } = require('../utils/emailSender');

const notificationQueue = new Queue('notificationQueue', process.env.REDIS_URL);

exports.setupBullQueue = () => {
  notificationQueue.process('sendNotification', async (job) => {
    const { type, recipient, data } = job.data;
    switch (type) {
      case 'email':
        await sendEmail(recipient, data.subject, data.body);
        break;
      // Add cases for other notification types (SMS, push) in the future
      default:
        console.log(`Unsupported notification type: ${type}`);
    }
  });
};

exports.notificationQueue = notificationQueue;

