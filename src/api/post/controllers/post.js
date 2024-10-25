'use strict';

/**
 * post controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post', ({strapi}) => ({

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


    async getCommentsByPost(ctx) {
        try {
            const {postId} = ctx.params;

            if (!postId) {
                return ctx.badRequest('postId is required');
            }

            // Fetch the post by ID and populate its comments
            const post = await strapi.entityService.findOne('api::post.post', postId, {
                populate: {comments: true},
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
