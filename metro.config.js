const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const nodeLibs = {
  // Real polyfills
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  url: require.resolve('url'),
  path: require.resolve('path-browserify'),
  assert: require.resolve('assert'),
  os: require.resolve('os-browserify'),
  // Stubs for unused modules
  http: require.resolve('empty-module'),
  https: require.resolve('empty-module'),
  zlib: require.resolve('empty-module'),
  tls: require.resolve('empty-module'),
  net: require.resolve('empty-module'),
  fs: require.resolve('empty-module'),
};

const defaultConfig = getDefaultConfig(__dirname);

// Add Node.js polyfills
defaultConfig.resolver.extraNodeModules = new Proxy(nodeLibs, {
  get: (target, name) =>
    // fallback to project's own node_modules
    target[name] || path.join(__dirname, `node_modules/${name}`)
});

// Include common extensions
defaultConfig.resolver.sourceExts.push('cjs');

// Enable inline requires
defaultConfig.transformer.getTransformOptions = async () => ({
  transform: { experimentalImportSupport: false, inlineRequires: true }
});

module.exports = defaultConfig;