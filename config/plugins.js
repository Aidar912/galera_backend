const streakRoutes = require('../config/swagger_custom_routes/streakRoutes.json')

module.exports = () => ({});
module.exports = ({env}) => ({
   documentation: {
    enabled: true,
    config: {
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
