const {ApplicationError} = require("@strapi/utils").errors;


module.exports = {

    async afterCreate(event) {
        const {result, params} = event;
        try {
            const userRoomSettingData = params.data.room_setting || {};

            await strapi.entityService.create("api::room-setting.room-setting", {
                data: {
                    room: result.id,
                    close: userRoomSettingData.close !== undefined ? userRoomSettingData.close : false, // Use user data or default
                    period: userRoomSettingData.period || 1, // Use user data or default
                    isGlobal: userRoomSettingData.isGlobal !== undefined ? userRoomSettingData.isGlobal : false, // Use user data or default
                    publishedAt: new Date(),
                },
            });

        } catch (error) {
            throw new ApplicationError('Failed to create a settings');
        }
    },
};
