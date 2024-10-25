const streakRoutes = require('../config/swagger_custom_routes/streakRoutes.json')

module.exports = () => ({});
module.exports = ({env}) => ({
    documentation: {
        enabled: true,
        config: {
            servers: [{url: 'http://40.67.243.239/api', description: 'Development server'}],
            paths: {
                ...streakRoutes
            }
        }
    },


    'users-permissions': {
        config: {
            jwtSecret: env('JWT_SECRET'),
            expiresIn: '7d',
        },
    },
});
