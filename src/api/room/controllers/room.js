'use strict';

/**
 * room controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::room.room', ({strapi}) => ({
    // Extending the default controller
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
            // Get roomId and userId from the request body
            const {roomId} = ctx.request.body;
            const {id: userId, password} = ctx.state.user;

            // Validate that both roomId and userId are provided
            if (!roomId || !userId) {
                return ctx.badRequest('Both roomId and userId are required');
            }

            // Fetch the room by ID and populate the users
            const room = await strapi.entityService.findOne('api::room.room', roomId, {
                populate: {users: true},
            });

            // Log the room data for debugging

            // If the room is not found, return a 404 error
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


    async topRooms(ctx) {
        try {
            // Extract and validate pagination parameters from the query string
            const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
            const pageSize = Math.max(1, parseInt(ctx.query.pageSize, 10) || 10);

            // Fetch all rooms and populate users
            const rooms = await strapi.entityService.findMany("api::room.room", {
                populate: {
                    users: true,
                    room_setting: true


                },
            });

            if (!rooms) {
                return ctx.notFound("No rooms found");
            }

            // Sort rooms by number of users in descending order
            const sortedRooms = rooms.sort((a, b) => (b.users.length || 0) - (a.users.length || 0));

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const paginatedRooms = sortedRooms.slice(startIndex, startIndex + pageSize);

            // Send the paginated and sorted result
            ctx.send({
                data: paginatedRooms,
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
