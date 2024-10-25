'use strict';

/**
 * post router
 */

const {createCoreRouter} = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::post.post', {

    routes: [
        {
            method: "POST",
            path: "/post",
            handler: "post.create"
        }
    ],
});
