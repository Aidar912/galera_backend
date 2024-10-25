module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/posts/:postId/comments',
            handler: 'post.getCommentsByPost',

        },
        {
            method: 'GET',
            path: '/room/:roomId/posts/',
            handler: 'post.getPostByRoomId',

        },
    ],
};
