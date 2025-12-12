const requiredEnv = ['GRAPHHOPPER_API_KEY'];

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
    },

    validateEnv() {
        const missing = requiredEnv.filter(k => !process.env[k]);
        if (missing.length) {
            const err = new Error(`Missing required environment variables: ${missing.join(', ')}`);
            err.code = 'MISSING_ENV';
            throw err;
        }
        return true;
    },

    getGraphhopperKey() {
        return process.env.GRAPHHOPPER_API_KEY || null;
    }
};

module.exports = config;
