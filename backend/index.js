// Import dependencies
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

// Example route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// TODO: Import your other routes here
// Example: import userRoutes from './routes/users.js';
// app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
