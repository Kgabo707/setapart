module.exports = {
  root: true,
  extends: ["expo", "prettier"],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: ["node_modules/", "dist/", ".expo/"],
  overrides: [
    {
      files: ["**/__tests__/**", "jest.setup.js"],
      env: { jest: true },
    },
  ],
};
