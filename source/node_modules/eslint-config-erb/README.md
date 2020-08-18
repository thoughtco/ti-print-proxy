eslint-config-erb
================

[![Travis Build Status](https://img.shields.io/travis/com/electron-react-boilerplate/eslint-config-erb.svg?logo=travis)](https://travis-ci.com/vikr01/renovate-config)
[![Dependency Status](https://img.shields.io/david/electron-react-boilerplate/eslint-config-erb.svg?label=dependencies)](https://david-dm.org/electron-react-boilerplate/eslint-config-erb)
[![npm version](https://img.shields.io/npm/v/eslint-config-erb.svg)](https://npmjs.org/package/eslint-config-erb)
[![npm downloads per month](https://img.shields.io/npm/dm/eslint-config-erb.svg)](https://npmjs.org/package/eslint-config-erb)

The eslint config for [`electron-react-boilerplate`](https://github.com/electron-react-boilerplate/electron-react-boilerplate).

The config extends [`eslint-config-airbnb`](https://www.npmjs.com/package/eslint-config-airbnb) by adding support for the following:

* [`eslint-plugin-prettier`](https://github.com/prettier/eslint-plugin-prettier)
* [`eslint-plugin-flowtype`](https://github.com/gajus/eslint-plugin-flowtype)
* [`eslint-plugin-compat`](https://github.com/amilajack/eslint-plugin-compat)

The config is optimal for linting react codebases that target the web as opposed to react native.

## Usage

1. Install the config:
```bash
# Yarn
yarn add --dev eslint-config-erb
# NPM
npm install --save-dev eslint-config-erb
```
2. Extend the config
```jsonc
// .eslintrc.json
{
  "extends": "erb"
}
```
