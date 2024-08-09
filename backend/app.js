const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to serve vehicle data
app.get('/api/vehicle-data', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading vehicle data:', err);
      return res.status(500).send('Server error');
    }
    res.json(JSON.parse(data));
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});