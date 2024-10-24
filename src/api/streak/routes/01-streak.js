module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/getUserStreak/room/:roomId',
      handler: 'streak.getUserStreak',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/manualCheck",
      handler: "streak.triggerCheck",
    }
  ],
}