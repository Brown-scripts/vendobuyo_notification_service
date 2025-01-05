const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { setupBullQueue } = require('./config/bull');
const { notificationQueue } = require('./config/bull');
const { errorHandler } = require('./middleware/errorHandler');
const cors = require('cors');


dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Setup Bull queue
setupBullQueue();

app.post('/', async (req, res) => {
  const { type, recipient, data } = req.body;
  try {
    await notificationQueue.add('sendNotification', { type, recipient, data });
    res.status(200).json({ message: 'Notification job added to queue' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding notification job', error: error.message });
  }
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

