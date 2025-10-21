import express from 'express';
import cors from 'cors';

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
const PORT = process.env.PORT || 5000; // Render/other platforms will provide PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
