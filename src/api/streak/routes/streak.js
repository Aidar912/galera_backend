'use strict';

/**
 * streak router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::streak.streak');
