const config = {
    rome: {
        lat: 41.9028,
        lng: 12.4964,
        name: 'Rome',
        displayName: 'Rome'
    },
    map: {
        defaultZoom: 6,
        maxZoom: 19,
        minZoom: 3
    }
};

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Get the route path from the URL
    const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '') || '/';

    // Route: /health
    if (path === '/health' || path === '/health/') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production'
            })
        };
    }

    // Route: /config
    if (path === '/config' || path === '/config/') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(config)
        };
    }

    // Route: /route
    if (path === '/route' || path === '/route/') {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        try {
            const { start, end, profile = 'car' } = JSON.parse(event.body);

            if (!start || !start.lat || !start.lng) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid start coordinates',
                        message: 'Start point must include lat and lng'
                    })
                };
            }

            if (!end || !end.lat || !end.lng) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid end coordinates',
                        message: 'End point must include lat and lng'
                    })
                };
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

                return {
                    statusCode: response.status,
                    headers,
                    body: JSON.stringify({
                        error: 'GraphHopper API error',
                        message: userMessage
                    })
                };
            }

            const data = await response.json();

            if (data.paths && data.paths.length > 0) {
                const routePath = data.paths[0];
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        route: {
                            distance: routePath.distance,
                            time: routePath.time,
                            coordinates: routePath.points.coordinates,
                            instructions: routePath.instructions,
                            bbox: routePath.bbox
                        },
                        info: data.info
                    })
                };
            } else {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        error: 'No route found',
                        message: 'Unable to find a route between the specified points'
                    })
                };
            }

        } catch (error) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: 'An error occurred while calculating the route'
                })
            };
        }
    }

    // 404 for unknown routes
    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Not found' })
    };
};
