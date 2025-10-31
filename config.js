// ARLTR Configuration File
// Modify these values to customize your instance

const CONFIG = {
    // Site Information
    SITE_TITLE: "ARLTR - All Roads Lead To Rome",
    SITE_DESCRIPTION: "All roads lead to Rome, don't believe me? Go try.",
    SITE_URL: "https://arltr.syslink.dev",
    
    // Destination City (Default: Rome)
    DESTINATION: {
        name: "Rome",
        displayName: "Rome - The Eternal City",
        coords: [41.9028, 12.4964] // [latitude, longitude]
    },
    
    // Map Settings
    MAP: {
        defaultZoom: 4,
        minZoom: 2,
        maxZoom: 18
    },
    
    // Route Colors and Styles
    ROUTES: {
        landRoute: {
            color: '#2196F3',
            weight: 3,
            opacity: 0.8
        },
        seaRoute: {
            color: '#ff0000',
            weight: 4,
            opacity: 0.8,
            dashArray: '15, 10'
        },
        errorRoute: {
            color: '#ff4444',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10'
        }
    },
    
    // Marker Icons
    ICONS: {
        destination: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        start: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        port: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
    },
    
    // Branding
    BRANDING: {
        footerText: "Made by",
        footerLink: "https://syslink.dev",
        footerLinkText: "SySLink",
        copyright: "© 2025",
        feedbackDiscord: "syslink.sh"
    },
    
    // Features
    FEATURES: {
        showBetaBadge: true,
        enableFeedbackButton: true,
        requestTimeout: 15000 // milliseconds
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}