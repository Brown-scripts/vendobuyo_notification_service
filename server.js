require('dotenv').config();

const { authenticate } = require('./middleware/auth');

const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const { receiveFromQueue } = require('./controllers/notificationController');

const app = express();
const port = process.env.PORT || 3004;

app.use(bodyParser.json());

// Use notification routes
app.use('', notificationRoutes);

// Start listening to the RabbitMQ queue
receiveFromQueue('order_status_queue');
receiveFromQueue('delivery_status_queue');
receiveFromQueue('payment_status_queue');

// Start the Express server
app.listen(port, () => {
  console.log(`Notification Service running on port ${port}`);
});
