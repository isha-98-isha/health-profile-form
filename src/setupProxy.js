const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://5.189.144.230:9000',
      changeOrigin: true,
    })
  );

  app.use(
    '/vyonic',
    createProxyMiddleware({
      target: 'http://5.189.144.230:9000',
      changeOrigin: true,
    })
  );
};
