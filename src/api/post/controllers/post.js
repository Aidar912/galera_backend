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

    async getPostByRoomId(ctx) {
        try {
            const {roomId} = ctx.params;

            const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
            const pageSize = Math.max(1, parseInt(ctx.query.pageSize, 10) || 10);

            const room = await strapi.entityService.findOne('api::room.room',roomId)

            if(!room){
                 return ctx.badRequest("Room not found");
            }

            const {results, pagination} = await strapi.entityService.findPage("api::post.post", {
                filters: {
                    room: {
                        id: roomId, // Filter posts by the roomId
                    },
                },
                populate: {
                    report: {
                        populate: {
                            votes: {
                                populate: {
                                    user: true
                                }
                            }
                        }
                    },
                    comments: true,
                    media: true, // Populate media field
                    user: { // Populate user and their image if exists
                        populate: {
                            image: true,
                        },
                    },
                },
                pagination: {
                    page,
                    pageSize,
                },
            });


            const baseUrl = process.env.BASE_URL;

            const modifiedData = results.map((item) => {
                // Initialize report data
                let reportData = null;

                // Check if the report exists
                if (item.report) {
                    // Initialize counts for approved status
                    let like = 0;
                    let dislike = 0;
                    const status = item.report.isClosed;
                    const reportId = item.report.id
                    // Count true/false approved status if report exists
                    if (item.report.votes && Array.isArray(item.report.votes)) {
                        item.report.votes.forEach((vote) => {
                            if (vote.approved === true) {
                                like++;
                            } else if (vote.approved === false) {
                                dislike++;
                            }
                        });
                    }

                    reportData = {
                        reportId,
                        like,
                        dislike,
                        status
                    };
                }

                return {
                    ...item,
                    media: item.media?.map(mediaItem =>
                        mediaItem.url ? `${baseUrl}${mediaItem.url}` : null
                    ) || [],
                    comments: item.comments.length,
                    user: item.user ? {
                        username: item.user.username,
                        image: item.user.image?.url ? `${baseUrl}${item.user.image.url}` : null,
                        email: item.user.email,
                    } : null,
                    report: reportData, // If report exists, show counts, otherwise null
                };
            });

            return {data: {name:room.name,goal:room.goal,posts:modifiedData}, meta: pagination};


        } catch (error) {
            console.error('Error fetching posts by room ID:', error);
            ctx.internalServerError('An error occurred while fetching posts by room ID');
        }
    },

    async find(ctx) {
        try {
            const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
            const pageSize = Math.max(1, parseInt(ctx.query.pageSize, 10) || 10);

            const {results, pagination} = await strapi.entityService.findPage("api::post.post", {
                filters: ctx.query.filters || {}, // Apply any existing filters
                populate: {
                    media: true, // Populate media field
                    user: { // Populate user and their image if exists
                        populate: {
                            image: true
                        }
                    },
                },
                pagination: {
                    page,
                    pageSize,
                },
            });

            const baseUrl = process.env.BASE_URL;

            // Modify the data to include full URLs for media and extract user information
            const modifiedData = results.map((item) => ({
                ...item,
                media: item.media?.map(mediaItem =>
                    mediaItem.url ? `${baseUrl}${mediaItem.url}` : null
                ) || [],
                user: item.user ? {
                    username: item.user.username,
                    image: item.user.image?.url ? `${baseUrl}${item.user.image.url}` : null,
                    email: item.user.email,
                } : null,
            }));

            // Return modified data and meta (pagination info)
            return {data: modifiedData, meta: pagination};
        } catch (error) {
            console.error('Error fetching posts:', error);
            ctx.internalServerError('An error occurred while fetching the posts');
        }
    },

    async findOne(ctx) {
        try {
            const {id} = ctx.params;

            const data = await strapi.entityService.findOne("api::post.post", id, {
                populate: {
                    media: true,
                    user: {
                        populate: {
                            image: true
                        }
                    },
                },
            });

            const baseUrl = process.env.BASE_URL;

            const modifiedData = {
                ...data,
                media: data.media?.map(mediaItem =>
                    mediaItem.url ? `${baseUrl}${mediaItem.url}` : null
                ) || [],
                user: data.user ? {

                    username: data.user.username,
                    image: `${baseUrl}${data.user.image.url}`,
                    email: data.user.email,
                } : null,
            };

            return {data: modifiedData};
        } catch (error) {
            console.error('Error fetching room:', error);
            ctx.internalServerError('An error occurred while fetching the room');
        }
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
