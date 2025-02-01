// notification-service/controllers/notificationController.js
const { sendEmail, sendSMS, sendPushNotification } = require('../services/notificationService');
const amqp = require('amqplib/callback_api');

// RabbitMQ URL from environment variables (set in Render or use .env)
const rabbitmqUrl = process.env.RABBITMQ_URL;

// Function to receive messages from RabbitMQ queue
const receiveFromQueue = (queue) => {
    amqp.connect(rabbitmqUrl, (error0, connection) => {
        if (error0) {
            console.error("RabbitMQ connection error:", error0);
            process.exit(1); // Exit on failure to connect
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error("RabbitMQ channel creation error:", error1);
                process.exit(1); // Exit on failure to create channel
            }

            // Declare the queue
            const q = queue;
            channel.assertQueue(q, { durable: true });
            console.log("Waiting for messages in %s. To exit press CTRL+C", q);

            // Consume messages from the queue
            channel.consume(
                q,
                (msg) => {
                    if (msg !== null) {
                        const update = JSON.parse(msg.content.toString());
                        console.log(`Received ${queue} update:`, update);

                        // // Handle the delivery update (send notification via email, SMS, or push)
                        // sendNotification(update);

                        // Acknowledge the message so it is removed from the queue
                        channel.ack(msg);
                    }
                },
                { noAck: false }
            );
        });
    });
};

// Function to send the notification based on delivery status
const sendNotification = (deliveryStatusUpdate) => {
    console.log(`Sending notification for delivery ${deliveryStatusUpdate.trackingNumber}:`);
    console.log(`Status: ${deliveryStatusUpdate.deliveryStatus}`);

    // Trigger email, SMS, and push notifications as needed
    //   sendEmail(deliveryStatusUpdate);
    //   sendSMS(deliveryStatusUpdate);
    //   sendPushNotification(deliveryStatusUpdate);
};

module.exports = { receiveFromQueue, sendNotification };
