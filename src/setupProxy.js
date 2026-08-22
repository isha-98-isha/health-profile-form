const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: 'http://5.189.144.230:9000',
      changeOrigin: true,
      pathRewrite: {
        '^/api/auth': '/auth',
      },
    })
  );
};
