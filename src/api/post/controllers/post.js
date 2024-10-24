'use strict';

/**
 * post controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post', ({ strapi }) => ({
    async getCommentsByPost(ctx) {
        try {
            const { postId } = ctx.params;

            if (!postId) {
                return ctx.badRequest('postId is required');
            }

            // Fetch the post by ID and populate its comments
            const post = await strapi.entityService.findOne('api::post.post', postId, {
                populate: { comments: true },
            });

            if (!post) {
                return ctx.notFound('Post not found');
            }

            // Send the comments of the post
            ctx.send(post.comments);
        } catch (error) {
            console.error(error);
            ctx.internalServerError('An error occurred while fetching comments for the post');
        }
    },
}));
