module.exports = {
    routes: [
        {
            method: "POST",
            path: "/rooms/enter",
            handler: "room.enterRoom",
        },
        {
            method: "POST",
            path: "/rooms/leave",
            handler: "room.leaveRoom",
        },
        {
            method: 'GET',
            path: '/rooms/:roomId/users',
            handler: 'room.findUsersByRoom',
            config: {
                auth: false, // Set to true if you need authentication
            },
        },
        {
            method: "GET",
            path : "/rooms/top-rooms",
            handler: "room.topRooms",
            config: {
                auth: false,
            },

        },
        // ... existing routes
    ],
};