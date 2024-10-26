'use strict';

/**
 * post controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({strapi}) => ({

    async create(ctx) {
        try {
            // Extract the user ID from the authenticated user
            const {id: userId} = ctx.state.user;

            // Extract postId and text from the request body
            const {postId, text} = ctx.request.body;

            // Check if postId and text are provided
            if (!postId || !text) {
                return ctx.badRequest('postId and text are required');
            }

            // Check if the post with the given ID exists
            const post = await strapi.entityService.findOne('api::post.post', postId);
            if (!post) {
                return ctx.notFound('Post not found');
            }

            // Create the new comment
            const newComment = await strapi.entityService.create('api::comment.comment', {
                data: {
                    text:text,
                    post: postId,
                    user: userId,
                    publishedAt:new Date(),
                },
            });

            // Return the created comment
            return ctx.send({data: newComment});
        } catch (error) {
            console.error('Error creating comment:', error);
            return ctx.internalServerError('An error occurred while creating the comment');
        }
    }


}));