const { sendEmail, sendSMS, sendPushNotification } = require('../services/notificationService');
const amqp = require('amqplib/callback_api');
require('dotenv').config();

// RabbitMQ URL from environment variables
const rabbitmqUrl = process.env.RABBITMQ_URL;

// Function to receive messages from RabbitMQ queue
const receiveFromQueue = (queue) => {
    amqp.connect(rabbitmqUrl, (error0, connection) => {
        if (error0) {
            console.error("❌ RabbitMQ connection error:", error0);
            process.exit(1);
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error("❌ RabbitMQ channel creation error:", error1);
                process.exit(1);
            }

            // Declare the queue
            channel.assertQueue(queue, { durable: true });
            console.log(`✅ Listening for messages in queue: ${queue}`);

            // Consume messages from the queue
            channel.consume(
                queue,
                (msg) => {
                    if (msg !== null) {
                        const update = JSON.parse(msg.content.toString());
                        console.log(`📥 Received message from ${queue}:`, update);

                        // Determine the type of notification and send
                        sendNotification(update, queue);

                        // Acknowledge the message
                        channel.ack(msg);
                    }
                },
                { noAck: false }
            );
        });
    });
};

const sendNotification = (update, queue) => {
    console.log(`📢 Sending Notification for ${queue} update`);

    let emailSubject = "";
    let emailBody = "";
    let icon = "";

    // Ensure essential fields are present in the update object
    if (!update.orderId || !update.sellerEmail || !update.buyerEmail) {
        console.error("❌ Error: Missing required fields.");
        console.error("Expected fields: orderId, sellerEmail, buyerEmail");
        console.error("Received update:", update);
        return;
    }

    // Assign targetEmail as sellerEmail (since targetEmail is missing)
    update.targetEmail = update.sellerEmail;

    // Determine the content based on the queue type
    if (queue === 'payment_status_queue') {
        if (!update.amount || !update.paymentStatus) {
            console.error("❌ Error: Missing payment amount or status.");
            return;
        }

        emailSubject = `💰 Payment Update: #${update.orderId}`;
        emailBody = `Your payment of <strong>$${update.amount}</strong> has been marked as: <strong>${update.paymentStatus.toUpperCase()}</strong>.<br>
                     The payment was made by <strong>${update.buyerEmail}</strong>.`;
        icon = "💰";

    } else if (queue === 'order_status_queue') {
        if (!update.status) {
            console.error("❌ Error: Missing order status.");
            return;
        }

        emailSubject = `🛒 Order Update: #${update.orderId}`;
        emailBody = `Your order status has been updated to: <strong>${update.status.toUpperCase()}</strong>.<br>
                     The product has been paid for by <strong>${update.buyerEmail}</strong>.`;
        icon = "🛒";

    } else if (queue === 'delivery_status_queue') {
        if (!update.status || !update.estimatedDelivery) {
            console.error("❌ Error: Missing delivery status or estimated delivery date.");
            return;
        }

        emailSubject = `🚚 Delivery Update: #${update.orderId}`;
        emailBody = `Your order is now <strong>${update.status.toUpperCase()}</strong>. Expected delivery: <strong>${update.estimatedDelivery}</strong>.<br>
                     The product has been paid for by <strong>${update.buyerEmail}</strong>.`;
        icon = "🚚";

    } else {
        console.error("❌ Error: Unknown queue type.");
        return;
    }

    // Beautiful HTML email template
    const formattedMessage = `
        <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; background: #ffffff; padding: 20px; margin: auto; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #4CAF50; font-size: 24px;">${icon} ${emailSubject}</h2>
                <hr style="border: none; height: 2px; background: #4CAF50; margin: 10px 0;">
                <p style="font-size: 18px; color: #333;">Hello,</p>
                <p style="font-size: 16px; color: #555;">${emailBody}</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>📌 Order ID:</strong> ${update.orderId}</p>
                    <p style="margin: 5px 0;"><strong>🚀 Status:</strong> <span style="color: #FF9800;">${update.status ? update.status.toUpperCase() : 'UNKNOWN'}</span></p>
                    ${update.totalPrice ? `<p style="margin: 5px 0;"><strong>💰 Total Price:</strong> $${update.totalPrice.toFixed(2)}</p>` : ''}
                    ${update.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>⏳ Estimated Delivery:</strong> ${update.estimatedDelivery}</p>` : ''}
                </div>

                <p style="text-align: center; font-size: 16px; color: #555;">We appreciate your business and can't wait to serve you again! 🎈</p>
                <hr style="border: none; height: 2px; background: #4CAF50; margin: 10px 0;">
                <p style="text-align: center; font-size: 14px; color: #777;">✨ Thank you for shopping with us! ✨</p>
            </div>
        </div>
    `;

    update.formattedMessage = formattedMessage;

    // Send Email
    sendEmail(update);

    // Uncomment these functions if needed
    // Send SMS
    // sendSMS(update);

    // Send Push Notification
    // sendPushNotification(update);
};

// Start receiving messages from specific queues
module.exports = { receiveFromQueue, sendNotification };
