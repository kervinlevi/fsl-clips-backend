module.exports.security = {
    cors: {
      allRoutes: true,
      allowOrigins: ['http://localhost:5173'],
      allowRequestHeaders: 'content-type,Authorization',
      allowResponseHeaders: 'Content-Type',
    },
  };