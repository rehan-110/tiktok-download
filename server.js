import express from 'express';
import cors from 'cors';
import tiktokRoutes from './routes/tiktok.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tiktok', tiktokRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'TikTok Downloader Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 TikTok Downloader API ready!`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
});