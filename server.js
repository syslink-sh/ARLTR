require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "unpkg.com"],
            imgSrc: ["'self'", "data:", "*.tile.openstreetmap.org", "raw.githubusercontent.com"],
            connectSrc: ["'self'", "graphhopper.com"],
        },
    },
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static('public'));

// Validate required environment variables early
try {
    config.validateEnv();
} catch (err) {
    console.error('Configuration error:', err.message);
    process.exit(1);
}

app.post('/api/route', async (req, res) => {
    try {
        const { start, end, profile = 'car' } = req.body;

        if (!start || !start.lat || !start.lng) {
            return res.status(400).json({ 
                error: 'Invalid start coordinates',
                message: 'Start point must include lat and lng' 
            });
        }

        if (!end || !end.lat || !end.lng) {
            return res.status(400).json({ 
                error: 'Invalid end coordinates',
                message: 'End point must include lat and lng' 
            });
        }

        const graphhopperUrl = 'https://graphhopper.com/api/1/route';
        const params = new URLSearchParams({
            key: process.env.GRAPHHOPPER_API_KEY,
            point: `${start.lat},${start.lng}`,
            profile: profile,
            locale: 'en',
            points_encoded: 'false',
            elevation: 'false',
            instructions: 'true',
            calc_points: 'true'
        });

        params.append('point', `${end.lat},${end.lng}`);

        const response = await fetch(`${graphhopperUrl}?${params.toString()}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            
            let userMessage = 'Failed to calculate route';
            if (errorData.message && errorData.message.includes('Cannot find point')) {
                userMessage = 'No roads found at this location. Please select a location with accessible roads.';
            } else if (errorData.message) {
                userMessage = errorData.message;
            }
            
            return res.status(response.status).json({
                error: 'GraphHopper API error',
                message: userMessage
            });
        }

        const data = await response.json();

        if (data.paths && data.paths.length > 0) {
            const path = data.paths[0];
            res.json({
                success: true,
                route: {
                    distance: path.distance,
                    time: path.time,
                    coordinates: path.points.coordinates,
                    instructions: path.instructions,
                    bbox: path.bbox
                },
                info: data.info
            });
        } else {
            res.status(404).json({
                error: 'No route found',
                message: 'Unable to find a route between the specified points'
            });
        }

    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while calculating the route'
        });
    }
});

app.get('/api/config', (req, res) => {
    res.json(config);
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ARLTR server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`GraphHopper API: ${config.getGraphhopperKey() ? 'Configured' : 'NOT CONFIGURED'}`);
});
