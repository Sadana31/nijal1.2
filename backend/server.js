// placeholder for server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/irm', require('./routes/irm.routes'));
app.use('/api/sb', require('./routes/sb.routes'));
app.use('/api/mapping', require('./routes/mapping.routes'));

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


 
