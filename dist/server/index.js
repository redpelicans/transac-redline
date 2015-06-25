'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.create = create;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rethinkdb = require('rethinkdb');

var _rethinkdb2 = _interopRequireDefault(_rethinkdb);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _app = require('./app');

var app = _interopRequireWildcard(_app);

var _initRdb = require('./init/rdb');

var _initRdb2 = _interopRequireDefault(_initRdb);

var _initGithash = require('./init/githash');

var _initGithash2 = _interopRequireDefault(_initGithash);

var logerror = (0, _debug2['default'])('transac:error'),
    loginfo = (0, _debug2['default'])('transac:info');

var resources = {};

var version = require('../../package.json').version;

function create(params) {
  var promise = new Promise(function (resolve, reject) {
    _async2['default'].parallel({
      conn: _initRdb2['default'].init(params.rethinkdb),
      githash: _initGithash2['default'].init(params.rethinkdb)
    }, function (err, init) {
      if (err) reject(err);
      resources.conn = init.conn;
      resources.version = version;
      resources.githash = init.githash;
      app.start(params, resources, function (err, server) {
        if (err) reject(err);
        resolve(server);
      });
    });
  });
  return promise;
}

function initRDB(params, resources) {
  return function (cb) {
    _rethinkdb2['default'].connect(params, function (err, conn) {
      if (err) return cb(err);
      conn.on('error', function (err) {
        logerror('Rethinkdb lost connection');
        logerror(err);
        conn.reconnect({ noreplyWait: false }, function (err, conn) {
          if (err) return logerror(err);
          loginfo('Rethinkdb has reconnected');
          resources.conn = conn;
        });
      });
      loginfo('Rethinkdb connected to database \'' + params.db + '\'');
      cb(null, conn);
    });
  };
}
//# sourceMappingURL=index.js.map