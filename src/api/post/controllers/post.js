'use strict';

/**
 * post controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post', ({strapi}) => ({

    async create(ctx) {
        try {
            const data = ctx.request.body;
            const {files} = ctx.request;

            const userId = ctx.state.user ? ctx.state.user.id : null;
            if (!userId) {
                return ctx.throw(403, 'User not authenticated');
            }

            let mediaIds = [];
            if (files && files.media) {
                const uploadedMedia = await strapi.plugins['upload'].services.upload.upload({
                    files: Array.isArray(files.media) ? files.media : [files.media],
                    data: {},
                });

                if (uploadedMedia && uploadedMedia.length > 0) {
                    mediaIds = uploadedMedia.map(media => media.id);
                }
            }

            const newPost = await strapi.entityService.create('api::post.post', {
                data: {
                    ...data,
                    user: userId, // Assign the authenticated user
                    media: mediaIds.length > 0 ? mediaIds : null,
                    publishedAt: new Date(),
                },
            });

            return ctx.send({data: newPost});
        } catch (error) {
            console.error('Error creating post with media:', error);
            ctx.throw(400, 'Error creating post with media');
        }
    },

    async find(ctx) {
        ctx.query = {...ctx.query, populate: ['media', 'user']};

        const {data, meta} = await super.find(ctx);

        const baseUrl = process.env.BASE_URL;

        const modifiedData = data.map((item) => ({
            ...item.attributes,
            media: item.attributes.media?.data?.map(mediaItem =>
                mediaItem.attributes.url ? `${baseUrl}${mediaItem.attributes.url}` : null
            ) || [],
            user: item.attributes.user, // Include user data
        }));

        return {data: modifiedData, meta};
    },

    async findOne(ctx) {
        ctx.query = {...ctx.query, populate: ['media', 'user']};

        const {data} = await super.findOne(ctx);

        const baseUrl = process.env.BASE_URL;

        const modifiedData = {
            ...data.attributes,
            media: data.attributes.media?.data?.map(mediaItem =>
                mediaItem.attributes.url ? `${baseUrl}${mediaItem.attributes.url}` : null
            ) || [],
            user: data.attributes.user, // Include user data
        };

        return {data: modifiedData};
    },

    
    async update(ctx) {
        try {
            const {id} = ctx.params;
            const data = ctx.request.body;
            const {files} = ctx.request;

            const userId = ctx.state.user ? ctx.state.user.id : null;
            if (!userId) {
                return ctx.throw(403, 'User not authenticated');
            }

            const existingPost = await strapi.entityService.findOne('api::post.post', id, {
                populate: ['user'],
            });

            if (!existingPost || existingPost.user.id !== userId) {
                return ctx.throw(403, 'You are not allowed to update this post');
            }

            let mediaIds = [];
            if (files && files.media) {
                const uploadedMedia = await strapi.plugins['upload'].services.upload.upload({
                    files: Array.isArray(files.media) ? files.media : [files.media],
                    data: {},
                });

                if (uploadedMedia && uploadedMedia.length > 0) {
                    mediaIds = uploadedMedia.map(media => media.id);
                }
            }

            const updatedPost = await strapi.entityService.update('api::post.post', id, {
                data: {
                    ...data,
                    media: mediaIds.length > 0 ? mediaIds : data.media,
                    updatedAt: new Date(),
                },
            });

            return ctx.send({data: updatedPost});
        } catch (error) {
            console.error('Error updating post with media:', error);
            ctx.throw(400, 'Error updating post with media');
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
