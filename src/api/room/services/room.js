'use strict';

/**
 * room service
 */

const {createCoreService} = require('@strapi/strapi').factories;

module.exports = createCoreService('api::room.room', ({strapi}) => ({

    async checkUserPosts() {
        const rooms = await strapi.query('api::room.room').findMany({
            populate: ['room_setting', 'users'],
        });

        const currentDate = new Date();

        for (const room of rooms) {
            const period = room.room_setting.period;

            for (const user of room.users) {
                await this.checkUserActivity(user, room, period, currentDate);
            }
        }
    },

    async checkUserActivity(user, room, period, currentDate) {
        const lastPost = await strapi.query('api::post.post').findOne({
            user: user.id,
            room: room.id,
            _sort: 'created_at:DESC',
        });

        if (!lastPost) {
            await this.createStreak(user.id, room.id, false);
        } else {
            const lastPostDate = new Date(lastPost.created_at);
            const daysDifference = Math.ceil((currentDate - lastPostDate) / (1000 * 60 * 60 * 24));

            if (daysDifference > period) {
                await this.resetStreak(user.id, room.id);
            }
        }
    },

    async resetStreak(userId, roomId) {
        try {
            await strapi.query('api::streak.streak').create({
                data: {
                    user: userId,
                    room: roomId,
                    accomplished: false,
                },
            });
        } catch (error) {
            strapi.log.error('Ошибка при сбросе Streak:', error);
        }
    },

    async createStreak(userId, roomId, accomplished) {
        try {
            await strapi.query('api::streak.streak').create({
                data: {
                    user: userId,
                    room: roomId,
                    accomplished: accomplished,
                },
            });
        } catch (error) {
            strapi.log.error('Ошибка при создании Streak:', error);
        }
    },

}));
