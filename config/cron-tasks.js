module.exports = {
  '0 0 * * *': async () => {
    try {
      // Вызов функции checkUserPosts из сервиса room
      await strapi.service('api::room.room').checkUserPosts();
    } catch (error) {
      strapi.log.error('Ошибка выполнения cron-задачи:', error);
    }
  },
};
