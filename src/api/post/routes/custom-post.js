module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/posts/:postId/comments',
            handler: 'post.getCommentsByPost',
            config: {

                auth: false, // Enable authentication if needed
            },
        },
    ],
};
