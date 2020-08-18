'use strict';

var _path = require('path');

var ELECTRON_BROWSER_INIT_PATHS = ['electron/js2c/browser_init', // NOTE: >= Electron v7.0.0
['electron.asar', 'browser', 'init.js'].join(_path.sep) // NOTE: <= Electron v6.1.5
];

function isBrowserInitModule(path) {
    return ELECTRON_BROWSER_INIT_PATHS.some(function (initPath) {
        return path.endsWith(initPath);
    });
}

module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var isMain = args[2];
        var isNotBrowserInitMainModule = isMain && !isBrowserInitModule(args[0]);

        if (isNotBrowserInitMainModule) {
            if (config.appPath) {
                config.appEntryPoint = require.resolve(config.appPath);

                args[0] = config.appEntryPoint;
            } else config.appEntryPoint = require.resolve(args[0]);

            var installElectronMocks = require('./electron-mocks');

            installElectronMocks(config, testPageUrl);

            Module._load = origModuleLoad;
        }

        return origModuleLoad.apply(this, args);
    };
};