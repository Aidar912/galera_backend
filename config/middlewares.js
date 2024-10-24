module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  async (ctx, next) => {
    // Custom inline middleware logic for specific routes
    if (ctx.request.path.startsWith('/votes/findByReport')) {
      // Example: Check if the user is authenticated
      if (!ctx.state.user) {
        // If not authenticated, return unauthorized response
        return ctx.unauthorized('You must be logged in to access this resource');
      }
      // You can add more logic here as needed
    }
    // Continue to the next middleware/controller if the user is authenticated or it's not the specific route
    await next();
  },
];
