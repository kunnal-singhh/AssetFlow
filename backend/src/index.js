// Developer 1: Initialize Express and middlewares (CORS, JSON).
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Developer 1: Setup global error handler
// ...

// Load routes (Delegated to Developer 2, 3, 4)
const assetRoutes = require('./routes/assetRoutes');
const auditRoutes = require('./routes/auditRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/assets', assetRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.send('AssetFlow API Running');
});

// Start Server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
