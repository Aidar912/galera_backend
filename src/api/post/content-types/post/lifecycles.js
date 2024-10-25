const {ApplicationError} = require("@strapi/utils").errors;


module.exports = {


    async afterUpdate(event) {
        const {result} = event;

        const post = await strapi.db.query('api::post.post').findOne({
            where: {id: result.id}
        });


        if (post) {

            if (!post.approved) {
                try {
                    await strapi.db.query('api::streak.streak').update({
                        where: {
                            post: post.id
                        },
                        data: {
                            accomplished: false
                        }
                    });
                } catch (e) {
                    throw new ApplicationError("Failed to update a streak")
                }
            } else {
                try {
                    await strapi.db.query('api::streak.streak').update({
                        where: {
                            post: post.id
                        },
                        data: {
                            accomplished: true
                        }
                    });
                } catch (e) {
                    throw new ApplicationError("Failed to update a streak")
                }
            }


        }
    },

    async afterCreate(event) {
        const {result} = event;

        const post = await strapi.db.query('api::post.post').findOne({
            where: {id: result.id},
            populate: {
                user: true,
                room: {
                    populate: {
                        room_setting: true,
                    },
                },
            },
        });

        if (post) {
            try {
                const roomSetting = post.room.room_setting;
                if (!roomSetting || !roomSetting.period) {
                    strapi.log.warn(`Комната ${post.room.id} не имеет установленного периода в настройках.`);
                    return;
                }

                const postDate = new Date(post.createdAt);
                const currentDate = new Date();
                const daysDifference = Math.ceil((currentDate - postDate) / (1000 * 60 * 60 * 24));

                if (daysDifference > roomSetting.period) {


                    await strapi.db.query('api::streak.streak').create({
                        data: {
                            user: post.user.id,
                            room: post.room.id,
                            post: post.id,
                            accomplished: false,
                            publishedAt: new Date(),
                        },
                    });
                } else {
                    await strapi.db.query('api::streak.streak').create({
                        data: {
                            user: post.user.id,
                            room: post.room.id,
                            post: post.id,
                            accomplished: true,
                            publishedAt: new Date(),
                        },
                    });
                }
            } catch (e) {
                throw new ApplicationError('Failed to create a streak');
            }
        }
    }

};
