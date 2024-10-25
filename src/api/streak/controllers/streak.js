'use strict';

/**
 * streak controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::streak.streak', ({strapi}) => ({

    async getUserStreak(ctx) {
        const {roomId} = ctx.params;
        const {id: userId} = ctx.state.user;

        const streaks = await strapi.service('api::streak.streak').find({
            filters: {
                user: userId,
                room: roomId
            },
            sort: [{createdAt: 'desc'}]
        });

        let streakCount = 0;
        for (const streak of streaks.results) {
            if (!streak.accomplished) break;
            streakCount++;
        }

        return {streakCount};
    },

    async triggerCheck(ctx) {
        try {
            await strapi.service('api::room.room').checkUserPosts();
            ctx.send({message: 'Проверка завершена успешно'});
        } catch (error) {
            console.log(error)
            ctx.throw(500, 'Ошибка выполнения проверки');
        }
    },
}));
