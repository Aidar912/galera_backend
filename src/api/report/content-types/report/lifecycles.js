const schedule = require('node-schedule');

module.exports = {


    async afterUpdate(event) {
        const {result} = event;


    },

    async afterCreate(event) {
        const {result} = event;

        schedule.scheduleJob(new Date(Date.now() +  24 * 60 * 60 * 1000), async () => {

            const report = await strapi.db.query('api::report.report').findOne({
                where: {
                    id: result.id
                },
                populate: {
                    post:true,
                    votes: {
                        populate: {
                            user: true
                        }
                    }
                }
            });

            if (report && !report.isClosed) {
                const votes = report.votes || [];
                const approvedCount = votes.filter(vote => vote.approved === true).length;
                const rejectedCount = votes.length - approvedCount;

                if (approvedCount < rejectedCount) {


                    await strapi.db.query('api::post.post').update({
                        where: {
                            id: report.post.id
                        },
                        data: {
                            approved: false
                        }
                    });
                } else {
                    await strapi.db.query('api::post.post').update({
                        where: {
                            id: report.post.id
                        },
                        data: {
                            approved: true
                        }
                    });
                }


                await strapi.db.query('api::report.report').update({
                    where: {id: result.id},
                    data: {isClosed: true}
                });

                console.log(`Report with ID ${result.id} has been closed automatically.`);
            }
        });
    }

};
