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
                        sendNotification(update);

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
const sendNotification = (update) => {
    console.log(`📢 Sending Notification for Order #${update.orderId}`);

    const emailContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        
        <h2 style="color: #4CAF50; text-align: center;">🎉 Your Order Has Been Updated! 🎉</h2>
        
        <p>Hi there,</p>
        <p>We're excited to update you on the status of your order. Here are the details:</p>

        <p><strong>📌 Order ID:</strong> <span style="color: #333;">${update.orderId}</span></p>
        <p><strong>🚀 Status:</strong> <span style="color: #FF9800; font-weight: bold;">${update.status.toUpperCase()}</span></p>
        <p><strong>💰 Total Price:</strong> <span style="color: #333;">$${update.totalPrice.toFixed(2)}</span></p>

        <p><strong>📞 Contact:</strong></p>
        <ul style="list-style: none; padding-left: 0;">
            <li>📧 <strong>Email:</strong> ${update.targetEmail}</li>
            <li>📱 <strong>Phone:</strong> ${update.targetPhone}</li>
        </ul>

        <hr style="border: none; border-top: 2px dashed #4CAF50;" />

        <h3 style="color: #2196F3;">🛒 Items in Your Order:</h3>
        <ul style="padding: 0; list-style-type: none;">
            ${update.products
                .map(
                    (product) => `
                    <li style="background: #f9f9f9; padding: 10px; margin-bottom: 8px; border-radius: 5px;">
                        <p><strong>🏷️ Item:</strong> ${product.title}</p>
                        <p><strong>🔢 Quantity:</strong> ${product.quantity}</p>
                        <p><strong>💵 Price:</strong> $${product.price.toFixed(2)}</p>
                        <p><strong>📦 Status:</strong> <span style="color: ${product.status.toUpperCase() === 'PENDING' ? '#FF9800' : '#4CAF50'};">${product.status.toUpperCase()}</span></p>
                    </li>
                `
                )
                .join('')}
        </ul>

        <p style="text-align: center;">🎈 <em>We appreciate your business and can't wait to serve you again! 🎈</em></p>
        
        <hr style="border: none; border-top: 2px dashed #4CAF50;" />

        <p style="text-align: center; color: #555;">✨ <strong>Thank you for shopping with us!</strong> ✨</p>
    </div>
`;


    console.log(emailContent); // Log the formatted email content

    // Send Email
    sendEmail({ ...update, formattedMessage: emailContent });

    // Uncomment if SMS or Push notifications are required
    // sendSMS(update);
    // sendPushNotification(update);
};


module.exports = { receiveFromQueue, sendNotification };
