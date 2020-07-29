'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (id, mainPath) {
    var configPath = mainPath;
    var config = void 0;
    var mainDir = void 0;

    if ((0, _fs.statSync)(mainPath).isDirectory()) {
        mainDir = mainPath;

        var allowedExtensions = ['.js', '.json'];

        // get first allowed extension config file that exists.
        allowedExtensions.some(function (ext) {
            var possibleConfig = _path2.default.join(mainPath, _constants2.default.configFileName + ext);

            var exists = (0, _fs.existsSync)(possibleConfig);

            if (exists) configPath = possibleConfig;

            return exists;
        });
    }

    mainDir = mainDir || _path2.default.dirname(mainPath);

    // check if we have a specific ext and can use require.
    if (_path2.default.extname(configPath)) config = require(configPath);else {
        // fall back to .testcafe-electron-rc file w/ no extension
        var configString = (0, _fs.readFileSync)(_path2.default.join(mainPath, _constants2.default.configFileName)).toString();

        config = JSON.parse(configString);
    }

    if (config.appPath && !(0, _isAbsolute2.default)(config.appPath)) config.appPath = _path2.default.resolve(mainDir, config.appPath);

    if (config.electronPath) {
        if (!(0, _isAbsolute2.default)(config.electronPath)) config.electronPath = _path2.default.resolve(mainDir, config.electronPath);else config.electronPath = _path2.default.resolve(config.electronPath);
    } else config.electronPath = require('electron');

    if (config.mainWindowUrl.indexOf('file:') === 0 || !PROTOCOL_RE.test(config.mainWindowUrl)) config.mainWindowUrl = (0, _resolveFileUrl2.default)(mainDir, config.mainWindowUrl);

    config.serverId = 'testcafe-electron-server-' + id;
    config.clientId = 'testcafe-electron-client-' + id;

    return config;
};

var _fs = require('fs');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _resolveFileUrl = require('./resolve-file-url');

var _resolveFileUrl2 = _interopRequireDefault(_resolveFileUrl);

var _isAbsolute = require('./is-absolute');

var _isAbsolute2 = _interopRequireDefault(_isAbsolute);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PROTOCOL_RE = /^([\w-]+?)(?=\:\/\/)/;

module.exports = exports['default'];