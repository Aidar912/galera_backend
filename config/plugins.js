module.exports = () => ({});
module.exports = ({env}) => ({
  documentation: {
    enabled: true,
  },



  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
      expiresIn: '7d',
    },
  },
});
