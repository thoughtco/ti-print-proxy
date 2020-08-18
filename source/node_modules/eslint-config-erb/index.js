module.exports = {
  extends: [
    "airbnb",
    "plugin:react/recommended",
    "plugin:import/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
    "plugin:promise/recommended",
    "plugin:compat/recommended",
    "plugin:react-hooks/recommended",
  ],
  env: {
    browser: true,
    node: true,
  },
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
};
