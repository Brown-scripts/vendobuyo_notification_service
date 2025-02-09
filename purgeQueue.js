// purgeQueue.js
const amqp = require('amqplib/callback_api');

// Function to purge a queue
const purgeQueue = (queue) => {
    const rabbitmqURL = process.env.RABBITMQ_URL;

    amqp.connect(rabbitmqURL, (error0, connection) => {
        if (error0) {
            console.error("❌ RabbitMQ connection error:", error0);
            return;
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error("❌ RabbitMQ channel creation error:", error1);
                return;
            }

            // Purge the queue (this will delete all messages in the queue)
            channel.purgeQueue(queue, (error, ok) => {
                if (error) {
                    console.error("❌ Error purging the queue:", error);
                } else {
                    console.log(`✅ Successfully purged the queue: ${queue}`);
                }
            });
        });

        // Close the connection after some delay
        setTimeout(() => connection.close(), 500);
    });
};

// Export the function to use it in other files
module.exports = purgeQueue;

purgeQueue('payment_status_queue');