import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    try {
        const { start, end, profile = 'car' } = await request.json();

        if (!start || !start.lat || !start.lng || !end || !end.lat || !end.lng) {
            return json({
                error: 'Invalid coordinates',
                message: 'Start and end points must include lat and lng'
            }, { status: 400 });
        }

        const apiKey = env.GRAPHHOPPER_API_KEY;
        if (!apiKey) {
            return json({
                error: 'Config error',
                message: 'API KEY NOT CONFIGURED, PLEASE CONTACT SITE OWNER'
            }, { status: 500 });
        }

        const graphhopperUrl = 'https://graphhopper.com/api/1/route';
        const params = new URLSearchParams({
            key: apiKey,
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
            let userMessage = errorData.message || 'Failed to calculate route';

            if (userMessage.includes('Cannot find point')) {
                userMessage = 'No roads found at this location. Please select a location with accessible roads.';
            }

            return json({
                error: 'GraphHopper API error',
                message: userMessage
            }, { status: response.status });
        }

        const data = await response.json();

        if (data.paths && data.paths.length > 0) {
            const path = data.paths[0];
            return json({
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
            return json({
                error: 'No route found',
                message: 'Unable to find a route between the specified points'
            }, { status: 404 });
        }

    } catch (error) {
        console.error('Route calculation error:', error);
        return json({
            error: 'Internal server error',
            message: 'An error occurred while calculating the route'
        }, { status: 500 });
    }
}
