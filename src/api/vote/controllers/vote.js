'use strict';

/**
 * post controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post', ({ strapi }) => ({
    async countVotesByReportId(ctx) {
        try {
            const { reportId } = ctx.params;

            if (!reportId) {
                return ctx.badRequest('postId is required');
            }

            // Count the number of votes where the value is true
            const trueVotesCount = await strapi.entityService.count('api::vote.vote', {
                filters: { report: reportId, approved: true },
            });

            // Count the number of votes where the value is false
            const falseVotesCount = await strapi.entityService.count('api::vote.vote', {
                filters: { report: reportId, approved: false },
            });

            // Send the response with counts of true and false votes
            ctx.send({
                true: trueVotesCount,
                false: falseVotesCount,
            });
        } catch (error) {
            console.error(error);
            ctx.internalServerError('An error occurred while counting votes for the post');
        }
    },
}));
