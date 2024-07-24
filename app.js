const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const adminRoutes = require('./routes/adminRoutes');

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());

  // Route middleware
  app.use('/api', authRoutes);
  
  app.use('/api',authMiddleware, userRoutes);

  //   Start Admin Api

  app.use('/api',authMiddleware, adminRoutes);

  //   End Admin Api

module.exports = app