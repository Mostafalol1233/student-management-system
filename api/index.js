// Vercel Serverless Function Entry Point
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS support for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Import your existing routes from server directory
// Note: For production, you'll need to adapt your existing routes
// For now, here's a basic example:

// Basic health check endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Students endpoints - adapt from your existing routes
app.get('/api/students', (req, res) => {
  // Your existing student fetching logic here
  res.json({ students: [], message: 'Students endpoint working' });
});

app.post('/api/students', (req, res) => {
  // Your existing student creation logic here
  res.json({ message: 'Student created successfully', data: req.body });
});

// Sessions endpoints
app.get('/api/sessions', (req, res) => {
  res.json({ sessions: [], message: 'Sessions endpoint working' });
});

// Attendance endpoints
app.get('/api/attendance', (req, res) => {
  res.json({ attendance: [], message: 'Attendance endpoint working' });
});

// WhatsApp endpoints
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: 'disconnected', message: 'WhatsApp service status' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Export for Vercel
module.exports = app;