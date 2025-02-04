// notification-service/services/notificationService.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');

// Initialize Firebase Admin for push notifications
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Function to send email notifications
const sendEmail = (update) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: update.targetEmail.trim(),
    subject: `Order Update: #${update.orderId}`,
    text: `Order ID: ${update.orderId}\nStatus: ${update.status}\nTotal: $${update.totalPrice}\nSee more details in HTML version.`,
    html: update.formattedMessage, 
};

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email sending error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

// Function to send SMS notifications
const sendSMS = (update) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  client.messages.create({
    body: `${update}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: update.targetPhone, // Replace with recipient's phone number
  })
    .then((message) => console.log(`SMS sent: ${message.sid}`))
    .catch((error) => console.error('SMS sending error:', error));
};

// Function to send push notifications
const sendPushNotification = (update) => {
  const message = {
    notification: {
      title: `Delivery Status: ${update.trackingNumber}`,
      body: `Your delivery status is now: ${update.deliveryStatus}`,
    },
    topic: 'delivery_updates', // You can use a specific topic for targeting
  };

  admin.messaging().send(message)
    .then((response) => {
      console.log('Push notification sent successfully:', response);
    })
    .catch((error) => {
      console.error('Push notification error:', error);
    });
};

module.exports = { sendEmail, sendSMS, sendPushNotification };
