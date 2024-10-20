'use strict';

/**
 * streak controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::streak.streak');
