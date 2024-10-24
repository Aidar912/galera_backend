module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/votes/findByReport/:reportId',
            handler: "vote.countVotesByReportId",
            config: {
                auth: false,
            }
        },

    ]
}