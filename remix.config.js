/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  future: {
    v2_routeConvention: true,
    v2_errorBoundary: true,
  },
  serverDependenciesToBundle: ['log-update'],
};
