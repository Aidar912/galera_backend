'use strict';

/**
 * room controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::room.room', ({strapi}) => ({
    async update(ctx) {
        try {
            const {id} = ctx.params;
            const data = ctx.request.body;
            const {files} = ctx.request;

            let imageId = null;
            if (files && files.image) {
                const uploadedImage = await strapi.plugins['upload'].services.upload.upload({
                    files: files.image,
                    data: {},
                });

                if (uploadedImage && uploadedImage.length > 0) {
                    imageId = uploadedImage[0].id;
                }
            }

            const updatedRoom = await strapi.entityService.update('api::room.room', id, {
                data: {
                    ...data,
                    image: imageId ? imageId : data.image,
                    updatedAt: new Date(),
                },
            });

            return ctx.send({data: updatedRoom});
        } catch (error) {
            console.error('Error updating room with image:', error);
            ctx.throw(400, 'Error updating room with image');
        }
    },

    async create(ctx) {
        try {
            const data = ctx.request.body;
            const {files} = ctx.request;


            let imageId = null;
            if (files && files.image) {
                const uploadedImage = await strapi.plugins['upload'].services.upload.upload({
                    files: files.image,
                    data: {},
                });

                if (uploadedImage && uploadedImage.length > 0) {
                    imageId = uploadedImage[0].id;
                }
            }

            const newRoom = await strapi.entityService.create('api::room.room', {
                data: {
                    ...data,
                    image: imageId ? imageId : null,
                    publishedAt: new Date()
                },
            });

            return ctx.send({data: newRoom});
        } catch (error) {
            // Обработка ошибок
            console.error('Error creating room with image:', error);
            ctx.throw(400, 'Error creating room with image');
        }
    },

    async find(ctx) {
        const {search} = ctx.query;
        if (search) {
            ctx.query.filters = {
                ...ctx.query.filters,
                $or: [
                    {name: {$containsi: search}},
                ],
            };
        }

        // Ensure the image field is populated
        ctx.query = {...ctx.query, populate: 'image'};

        const {data, meta} = await super.find(ctx);

        const baseUrl = process.env.BASE_URL;
        const modifiedData = data.map((item) => ({
            ...item.attributes,
            image: item.attributes.image?.data?.attributes?.url
                ? `${baseUrl}${item.attributes.image.data.attributes.url}`
                : null,
        }));

        return {data: modifiedData, meta};
    },


    async findOne(ctx) {
        ctx.query = {...ctx.query, populate: 'image'};

        const {data} = await super.findOne(ctx);

        const baseUrl = process.env.BASE_URL;

        const modifiedData = {
            ...data.attributes,
            image: data.attributes.image?.data?.attributes?.url
                ? `${baseUrl}${data.attributes.image.data.attributes.url}`
                : null,
        };

        return {data: modifiedData};
    },

    async enterRoom(ctx) {
        try {
            const {roomId, password} = ctx.request.body;
            const {id: userId} = ctx.state.user;
            // Ensure roomId and userId are provided
            if (!roomId || !userId) {
                return ctx.badRequest("roomId and userId are required");
            }

            // Fetch the room by ID, including the users
            const room = await strapi.entityService.findOne("api::room.room", roomId, {
                populate: {users: true, room_setting: true},
            });

            if (!room) {
                return ctx.notFound("Room not found");
            }

            // Check if the user is already in the room
            const isUserInRoom = room.users && room.users.some(user => user.id === userId);
            if (isUserInRoom) {
                return ctx.badRequest("User is already in the room");
            }


            if (room.room_setting.close) {
                if (password) {

                    if (password === room.room_setting.password) {
                        const updatedRoom = await strapi.entityService.update(
                            "api::room.room",
                            roomId,
                            {
                                data: {
                                    users: {
                                        connect: [{id: userId}],
                                    },
                                },
                            }
                        );
                        ctx.send(updatedRoom);
                    } else {
                        ctx.badRequest('Incorrect password')
                    }
                } else {
                    ctx.badRequest('No password')
                }
            } else {

                // Update the room by adding the user
                const updatedRoom = await strapi.entityService.update(
                    "api::room.room",
                    roomId,
                    {
                        data: {
                            users: {
                                connect: [{id: userId}],
                            },
                        },
                    }
                );
                ctx.send(updatedRoom);
            }


        } catch (error) {
            strapi.log.error("Error in enterRoom:", error);
            ctx.internalServerError("An error occurred while entering the room");
        }
    },

    async leaveRoom(ctx) {
        try {
            const {roomId} = ctx.request.body;
            const {id: userId} = ctx.state.user;

            if (!roomId || !userId) {
                return ctx.badRequest('Both roomId and userId are required');
            }

            const room = await strapi.entityService.findOne('api::room.room', roomId, {
                populate: {users: true},
            });

            if (!room) {
                return ctx.notFound('Room not found');
            }

            // Check if the user is in the room (convert IDs to number for consistency)
            const numericUserId = Number(userId);
            const isUserInRoom = room.users && room.users.some(user => user.id === numericUserId);

            if (!isUserInRoom) {
                return ctx.badRequest('User is not in the room');
            }

            // Update the room by removing the user
            const updatedUsers = room.users.filter(user => user.id !== numericUserId);
            const updatedRoom = await strapi.entityService.update(
                'api::room.room',
                roomId,
                {
                    data: {
                        users: updatedUsers.map(user => user.id),
                    },
                }
            );

            // Send the updated room details as the response
            ctx.send(updatedRoom);
        } catch (error) {
            // Log the error for debugging and return an internal server error
            console.error(error);
            ctx.internalServerError('An error occurred while leaving the room');
        }
    },

    async findUserRooms(ctx) {
        try {

            const {id:userId} = ctx.state.user
            // Extract and validate pagination parameters from the query string
            const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
            const pageSize = Math.max(1, parseInt(ctx.query.pageSize, 10) || 10);

            // Fetch all rooms and populate specific fields, including image
            const rooms = await strapi.entityService.findMany("api::room.room", {
                filters: {
                    users: {
                        id: userId, // Filter rooms to include only those with the current user
                    },
                },
                populate: {
                    users: {
                        count: true, // Only get the count of users
                    },
                    room_setting: {
                        fields: ["close", "period", "isGlobal"], // Only fetch specific fields
                    },
                    image: true, // Ensure the image field is populated
                },
                pagination: {
                    page,
                    pageSize,
                },
            });

            if (!rooms) {
                return ctx.notFound("No rooms found");
            }

            // Sort rooms by number of users in descending order
            const sortedRooms = rooms.sort((a, b) => (b.users.count || 0) - (a.users.count || 0));

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const paginatedRooms = sortedRooms.slice(startIndex, startIndex + pageSize);

            // Construct the image URL
            const baseUrl = process.env.BASE_URL;

            // Modify the data structure to handle the image URL correctly
            const modifiedRooms = paginatedRooms.map((room) => ({
                ...room,
                close:room.room_setting.close,
                image: room.image?.url
                    ? `${baseUrl}${room.image.url}`
                    : null,
            }));

            ctx.send({
                data: modifiedRooms,
                pagination: {
                    page,
                    pageSize,
                    total: sortedRooms.length,
                    totalPages: Math.ceil(sortedRooms.length / pageSize),
                },
            });
        } catch (error) {
            console.error(error); // Log error for debugging
            ctx.internalServerError("An error occurred while fetching top rooms");
        }
    },

    async topRooms(ctx) {
        try {
            // Extract and validate pagination parameters from the query string
            const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
            const pageSize = Math.max(1, parseInt(ctx.query.pageSize, 10) || 10);

            // Fetch all rooms and populate specific fields, including image
            const rooms = await strapi.entityService.findMany("api::room.room", {
                populate: {
                    users: {
                        count: true, // Only get the count of users
                    },
                    room_setting: {
                        fields: ["close", "period", "isGlobal"], // Only fetch specific fields
                    },
                    image: true, // Ensure the image field is populated
                },
            });

            if (!rooms) {
                return ctx.notFound("No rooms found");
            }

            // Sort rooms by number of users in descending order
            const sortedRooms = rooms.sort((a, b) => (b.users.count || 0) - (a.users.count || 0));

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const paginatedRooms = sortedRooms.slice(startIndex, startIndex + pageSize);

            // Construct the image URL
            const baseUrl = process.env.BASE_URL;

            // Modify the data structure to handle the image URL correctly
            const modifiedRooms = paginatedRooms.map((room) => ({
                ...room,
                close:room.room_setting.close,
                image: room.image?.url
                    ? `${baseUrl}${room.image.url}`
                    : null,
            }));

            // Send the paginated and sorted result
            ctx.send({
                data: modifiedRooms,
                pagination: {
                    page,
                    pageSize,
                    total: sortedRooms.length,
                    totalPages: Math.ceil(sortedRooms.length / pageSize),
                },
            });
        } catch (error) {
            console.error(error); // Log error for debugging
            ctx.internalServerError("An error occurred while fetching top rooms");
        }
    },


    async findUsersByRoom(ctx) {
        try {
            // Get the roomId from the request parameters
            const {roomId} = ctx.params;

            if (!roomId) {
                return ctx.badRequest("roomId is required");
            }

            // Fetch the room by ID and populate the users
            const room = await strapi.entityService.findOne("api::room.room", roomId, {
                populate: {users: true},
            });

            if (!room) {
                return ctx.notFound("Room not found");
            }

            // Return the users in the room
            ctx.send(room.users);
        } catch (error) {
            ctx.internalServerError("An error occurred while retrieving users for the room");
        }
    },
    // Note: other default methods like `find`, `findOne`, `create`, `update`, etc., are automatically inherited from the core controller.
}));
