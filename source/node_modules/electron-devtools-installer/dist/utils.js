"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changePermissions = exports.downloadFile = exports.getPath = void 0;

var _electron = require("electron");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _https = _interopRequireDefault(require("https"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var getPath = function getPath() {
  var savePath = _electron.app.getPath('userData');

  return _path["default"].resolve("".concat(savePath, "/extensions"));
}; // Use https.get fallback for Electron < 1.4.5


exports.getPath = getPath;
var request = _electron.net ? _electron.net.request : _https["default"].get;

var downloadFile = function downloadFile(from, to) {
  return new Promise(function (resolve, reject) {
    var req = request(from);
    req.on('response', function (res) {
      // Shouldn't handle redirect with `electron.net`, this is for https.get fallback
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, to).then(resolve)["catch"](reject);
      }

      res.pipe(_fs["default"].createWriteStream(to)).on('close', resolve);
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
};

exports.downloadFile = downloadFile;

var changePermissions = function changePermissions(dir, mode) {
  var files = _fs["default"].readdirSync(dir);

  files.forEach(function (file) {
    var filePath = _path["default"].join(dir, file);

    _fs["default"].chmodSync(filePath, parseInt(mode, 8));

    if (_fs["default"].statSync(filePath).isDirectory()) {
      changePermissions(filePath, mode);
    }
  });
};

exports.changePermissions = changePermissions;