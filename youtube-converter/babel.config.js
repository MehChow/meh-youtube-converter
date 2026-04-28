module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = api.env('test');
  return {
    // NativeWind's Babel plugin can interfere with Jest's hoisted mocks.
    // Keep it enabled for app/runtime, disable for tests.
    presets: isTest
      ? ['babel-preset-expo']
      : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
