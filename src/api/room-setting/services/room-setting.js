'use strict';

/**
 * room-setting service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::room-setting.room-setting');
