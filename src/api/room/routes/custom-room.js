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

        },
        {
            method: "GET",
            path : "/rooms/top-rooms",
            handler: "room.topRooms",


        },
        // ... existing routes
    ],
};