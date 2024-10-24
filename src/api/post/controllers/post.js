'use strict';

/**
 * post controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post',({strapi}) => ({

  async create(ctx) {
    try {
      const {data} = ctx.request.body;
      const {id: userId} = ctx.state.user;
      if (!userId || !data.room || !data.content) {
        return ctx.badRequest('User, Room, and Content are required');
      }
      const newPost = await strapi.entityService.create('api::post.post', {
        data: {
          user: userId,
          content: data.content,
          room: data.room.id || data.room,
          createdAt: data.created_at || new Date(),
          publishedAt: data.published_at || new Date(),
          approved: data.approved || false,
        },
      });

      return ctx.send({data: newPost});
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      return ctx.internalServerError('Произошла ошибка при создании поста');
    }
  },

}));
