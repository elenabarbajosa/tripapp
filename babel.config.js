module.exports = function (api) {
  api.cache(true);

  // Jest sets NODE_ENV=test. Keep real `import()` for Metro so the native
  // Google adapter stays in an async chunk that Expo Go never evaluates.
  const isTest = process.env.NODE_ENV === "test";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ...(isTest ? ["babel-plugin-dynamic-import-node"] : []),
      "react-native-reanimated/plugin",
    ],
  };
};
