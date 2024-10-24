'use strict';

/**
 * room controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::room.room', ({ strapi }) => ({
    // Extending the default controller
    async enterRoom(ctx) {
        try {
            const { roomId } = ctx.request.body;

            // Get the authenticated user's ID
            const userId = ctx.state.user?.id;

            if (!roomId || !userId) {
                return ctx.badRequest("roomId is required, and the user must be authenticated");
            }

            // Fetch the room by ID, including the users
            const room = await strapi.entityService.findOne("api::room.room", roomId, {
                populate: { users: true },
            });

            if (!room) {
                return ctx.notFound("Room not found");
            }

            // Check if the user is already in the room
            const isUserInRoom = room.users && room.users.some(user => user.id === userId);
            if (isUserInRoom) {
                return ctx.badRequest("User is already in the room");
            }

            // Update the room by adding the user
            const updatedRoom = await strapi.entityService.update(
                "api::room.room",
                roomId,
                {
                    data: {
                        users: [...room.users.map(user => user.id), userId],
                    },
                }
            );

            ctx.send(updatedRoom);
        } catch (error) {
            ctx.internalServerError("An error occurred while entering the room");
        }
    },

    async leaveRoom(ctx) {},

    async topRooms(ctx) {
        try {
            // Extract and validate pagination parameters from the query string
            const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
            const pageSize = Math.max(1, parseInt(ctx.query.pageSize, 10) || 10);

            // Fetch all rooms and populate users
            const rooms = await strapi.entityService.findMany("api::room.room", {
                populate: { users: true },
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
            const { roomId } = ctx.params;

            if (!roomId) {
                return ctx.badRequest("roomId is required");
            }

            // Fetch the room by ID and populate the users
            const room = await strapi.entityService.findOne("api::room.room", roomId, {
                populate: { users: true },
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
