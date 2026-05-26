const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = async () => {
  // Config dotenv
  dotenv.config();
  
  // Import db config
  const db = require('./config/db');
  await db();
};

const startServer = async () => {
  await connectDB();
  
  const app = express();
  
  // Middlewares
  app.use(cors());
  app.use(express.json());
  
  // Import routes
  const notificationRoutes = require('./routes/notificationRoutes');
  
  // Use routes
  app.use('/api', notificationRoutes);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Notification Service' });
  });
  
  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
  });
  
  const PORT = process.env.PORT || 5004;
  app.listen(PORT, () => {
    console.log(`Notification Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start Notification Service', err);
});
