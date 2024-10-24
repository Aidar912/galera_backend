'use strict';

module.exports = async (ctx, next) => {
    if (ctx.state.user) {
        // If the user is authenticated, proceed to the next middleware or controller
        await next();
    } else {
        // If the user is not authenticated, return a 401 Unauthorized response
        return ctx.unauthorized('You must be logged in to perform this action');
    }
};
