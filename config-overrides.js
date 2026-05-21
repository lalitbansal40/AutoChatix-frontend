const webpack = require('webpack');
const WorkBoxPlugin = require('workbox-webpack-plugin');

module.exports = function override(config) {
  // Stop source-map-loader from crashing on missing source maps inside node_modules
  const sourceMapRule = config.module.rules.find(
    (r) => r.enforce === 'pre' && Array.isArray(r.use) &&
      r.use.some((u) => String(u.loader || u).includes('source-map-loader'))
  );
  if (sourceMapRule) {
    sourceMapRule.exclude = /node_modules/;
  }
  config.ignoreWarnings = [...(config.ignoreWarnings || []), /Failed to parse source map/];

  config.resolve.fallback = {
    process: require.resolve('process/browser'),
    // zlib: require.resolve('browserify-zlib'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    util: require.resolve('util'),
    buffer: require.resolve('buffer')
    // asset: require.resolve('assert')
  };

  // https://stackoverflow.com/questions/69135310/workaround-for-cache-size-limit-in-create-react-app-pwa-service-worker
  config.plugins.forEach((plugin) => {
    if (plugin instanceof WorkBoxPlugin.InjectManifest) {
      plugin.config.maximumFileSizeToCacheInBytes = 50 * 1024 * 1024;
    }
  });

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    })
  ];

  return config;
};
