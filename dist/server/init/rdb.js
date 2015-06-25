'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

var _rethinkdb = require('rethinkdb');

var _rethinkdb2 = _interopRequireDefault(_rethinkdb);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var logerror = (0, _debug2['default'])('transac:error'),
    loginfo = (0, _debug2['default'])('transac:info');

exports['default'] = { init: init };

var tables = {
  transacs: 'id'
};

function init(params, resources) {

  function initConnection(cb) {
    _rethinkdb2['default'].connect(params, function (err, conn) {
      if (err) return cb(err);
      conn.on('error', function (err) {
        logerror('RethinkDB connection lost');
        logerror(err);
        conn.reconnect({ noreplyWait: false }, function (err, conn) {
          if (err) return logerror(err);
          loginfo('RethinkDB has reconnected');
          resources.conn = conn;
        });
      });
      loginfo('RethinkDB connected to database \'' + params.db + '\'');
      cb(null, conn);
    });
  }

  function dbCreate(conn, cb) {
    _rethinkdb2['default'].dbList().run(conn, function (err, result) {
      if (err) return cb(err);
      if (_lodash2['default'].contains(result, params.db)) return setImmediate(cb, null, conn);
      _rethinkdb2['default'].dbCreate(params.db).run(conn, function (err, result) {
        if (err) return cb(err);
        loginfo('RethinkDB database ' + params.db + ' created');
        cb(null, conn);
      });
    });
  }

  function tablesCreate(conn, cb) {
    _async2['default'].map(_lodash2['default'].pairs(tables), tableCreate(conn), function (err) {
      cb(err, conn);
    });
  }

  function tableCreate(conn) {
    return function (x, cb) {
      var _x = _slicedToArray(x, 2);

      var table = _x[0];
      var index = _x[1];

      _rethinkdb2['default'].db(params.db).tableList().run(conn, function (err, result) {
        if (err) return cb(err);
        if (_lodash2['default'].contains(result, table)) return setImmediate(cb);
        _rethinkdb2['default'].db(params.db).tableCreate(table, { primaryKey: index }).run(conn, function (err) {
          if (err) return cb(err);
          loginfo('RethinkDB database \'' + params.db + '\' table \'' + table + '\' created');
          cb();
        });
      });
    };
  }

  return function (cb) {
    _async2['default'].waterfall([initConnection, dbCreate, tablesCreate], function (err, conn) {
      cb(err, conn);
    });
  };
}
module.exports = exports['default'];
//# sourceMappingURL=../init/rdb.js.map