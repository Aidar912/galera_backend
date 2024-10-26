'use strict';

/**
 * post controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vote.vote', ({strapi}) => ({

    async create(ctx) {
        try {
            // Extract the user ID from ctx.state.user
            const {id: userId} = ctx.state.user;

            // Extract the data from the request body
            const {approved, reportId} = ctx.request.body;

            // Ensure that the required fields are provided
            if (!reportId || typeof approved !== 'boolean') {
                return ctx.badRequest('Missing or invalid required fields: approved, reportId');
            }

            // Create a new vote entry
            const newVote = await strapi.entityService.create('api::vote.vote', {
                data: {
                    user: userId,          // Set the user field to the current user
                    approved,              // Boolean field to indicate approval status
                    report: reportId,      // Reference to the report (relationship)
                },
            });

            // Return the created vote entry
            return ctx.send({data: newVote});
        } catch (error) {
            // Log the error and send a server error response
            console.error('Error creating vote:', error);
            return ctx.internalServerError('An error occurred while creating the vote');
        }
    },

    async countVotesByReportId(ctx) {
        try {
            const {reportId} = ctx.params;

            if (!reportId) {
                return ctx.badRequest('postId is required');
            }

            // Count the number of votes where the value is true
            const trueVotesCount = await strapi.entityService.count('api::vote.vote', {
                filters: {report: reportId, approved: true},
            });

            // Count the number of votes where the value is false
            const falseVotesCount = await strapi.entityService.count('api::vote.vote', {
                filters: {report: reportId, approved: false},
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
