"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MOBX_DEVTOOLS = exports.APOLLO_DEVELOPER_TOOLS = exports.CYCLEJS_DEVTOOL = exports.REACT_PERF = exports.REDUX_DEVTOOLS = exports.VUEJS_DEVTOOLS = exports.ANGULARJS_BATARANG = exports.JQUERY_DEBUGGER = exports.BACKBONE_DEBUGGER = exports.REACT_DEVELOPER_TOOLS = exports.EMBER_INSPECTOR = exports["default"] = void 0;

var _electron = require("electron");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _semver = _interopRequireDefault(require("semver"));

var _downloadChromeExtension = _interopRequireDefault(require("./downloadChromeExtension"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var IDMap = {};

var getIDMapPath = function getIDMapPath() {
  return _path["default"].resolve((0, _utils.getPath)(), 'IDMap.json');
};

if (_fs["default"].existsSync(getIDMapPath())) {
  try {
    IDMap = JSON.parse(_fs["default"].readFileSync(getIDMapPath(), 'utf8'));
  } catch (err) {
    console.error('electron-devtools-installer: Invalid JSON present in the IDMap file');
  }
}

var install = function install(extensionReference) {
  var forceDownload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (process.type !== 'browser') {
    return Promise.reject(new Error('electron-devtools-installer can only be used from the main process'));
  }

  if (Array.isArray(extensionReference)) {
    return extensionReference.reduce(function (accum, extension) {
      return accum.then(function () {
        return install(extension, forceDownload);
      });
    }, Promise.resolve());
  }

  var chromeStoreID;

  if (_typeof(extensionReference) === 'object' && extensionReference.id) {
    chromeStoreID = extensionReference.id;
    var electronVersion = process.versions.electron.split('-')[0];

    if (!_semver["default"].satisfies(electronVersion, extensionReference.electron)) {
      return Promise.reject(new Error("Version of Electron: ".concat(electronVersion, " does not match required range ").concat(extensionReference.electron, " for extension ").concat(chromeStoreID)) // eslint-disable-line
      );
    }
  } else if (typeof extensionReference === 'string') {
    chromeStoreID = extensionReference;
  } else {
    return Promise.reject(new Error("Invalid extensionReference passed in: \"".concat(extensionReference, "\"")));
  }

  var extensionName = IDMap[chromeStoreID];
  var extensionInstalled = extensionName; // For Electron >=9.

  if (_electron.session.defaultSession.getExtension) {
    extensionInstalled = extensionInstalled && _electron.session.defaultSession.getAllExtensions().find(function (e) {
      return e.name === extensionName;
    });
  } else {
    extensionInstalled = extensionInstalled && _electron.BrowserWindow.getDevToolsExtensions && _electron.BrowserWindow.getDevToolsExtensions().hasOwnProperty(extensionName);
  }

  if (!forceDownload && extensionInstalled) {
    return Promise.resolve(IDMap[chromeStoreID]);
  }

  return (0, _downloadChromeExtension["default"])(chromeStoreID, forceDownload).then(function (extensionFolder) {
    // Use forceDownload, but already installed
    if (extensionInstalled) {
      // For Electron >=9.
      if (_electron.session.defaultSession.removeExtension) {
        var extensionId = _electron.session.defaultSession.getAllExtensions().find(function (e) {
          return e.name;
        }).id;

        _electron.session.defaultSession.removeExtension(extensionId);
      } else {
        _electron.BrowserWindow.removeDevToolsExtension(extensionName);
      }
    } // For Electron >=9.


    if (_electron.session.defaultSession.loadExtension) {
      return _electron.session.defaultSession.loadExtension(extensionFolder).then(function (ext) {
        return Promise.resolve(ext.name);
      });
    }

    var name = _electron.BrowserWindow.addDevToolsExtension(extensionFolder); // eslint-disable-line


    _fs["default"].writeFileSync(getIDMapPath(), JSON.stringify(Object.assign(IDMap, _defineProperty({}, chromeStoreID, name))));

    return Promise.resolve(name);
  });
};

var _default = install;
exports["default"] = _default;
var EMBER_INSPECTOR = {
  id: 'bmdblncegkenkacieihfhpjfppoconhi',
  electron: '>=1.2.1'
};
exports.EMBER_INSPECTOR = EMBER_INSPECTOR;
var REACT_DEVELOPER_TOOLS = {
  id: 'fmkadmapgofadopljbjfkapdkoienihi',
  electron: '>=1.2.1'
};
exports.REACT_DEVELOPER_TOOLS = REACT_DEVELOPER_TOOLS;
var BACKBONE_DEBUGGER = {
  id: 'bhljhndlimiafopmmhjlgfpnnchjjbhd',
  electron: '>=1.2.1'
};
exports.BACKBONE_DEBUGGER = BACKBONE_DEBUGGER;
var JQUERY_DEBUGGER = {
  id: 'dbhhnnnpaeobfddmlalhnehgclcmjimi',
  electron: '>=1.2.1'
};
exports.JQUERY_DEBUGGER = JQUERY_DEBUGGER;
var ANGULARJS_BATARANG = {
  id: 'ighdmehidhipcmcojjgiloacoafjmpfk',
  electron: '>=1.2.1'
};
exports.ANGULARJS_BATARANG = ANGULARJS_BATARANG;
var VUEJS_DEVTOOLS = {
  id: 'nhdogjmejiglipccpnnnanhbledajbpd',
  electron: '>=1.2.1'
};
exports.VUEJS_DEVTOOLS = VUEJS_DEVTOOLS;
var REDUX_DEVTOOLS = {
  id: 'lmhkpmbekcpmknklioeibfkpmmfibljd',
  electron: '>=1.2.1'
};
exports.REDUX_DEVTOOLS = REDUX_DEVTOOLS;
var REACT_PERF = {
  id: 'hacmcodfllhbnekmghgdlplbdnahmhmm',
  electron: '>=1.2.6'
};
exports.REACT_PERF = REACT_PERF;
var CYCLEJS_DEVTOOL = {
  id: 'dfgplfmhhmdekalbpejekgfegkonjpfp',
  electron: '>=1.2.1'
};
exports.CYCLEJS_DEVTOOL = CYCLEJS_DEVTOOL;
var APOLLO_DEVELOPER_TOOLS = {
  id: 'jdkknkkbebbapilgoeccciglkfbmbnfm',
  electron: '>=1.2.1'
};
exports.APOLLO_DEVELOPER_TOOLS = APOLLO_DEVELOPER_TOOLS;
var MOBX_DEVTOOLS = {
  id: 'pfgnfdagidkfgccljigdamigbcnndkod',
  electron: '>=1.2.1'
};
exports.MOBX_DEVTOOLS = MOBX_DEVTOOLS;