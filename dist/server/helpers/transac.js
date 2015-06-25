'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.loadOrCreate = loadOrCreate;
exports.findOne = findOne;
exports.loadAll = loadAll;
exports.load = load;
exports.addEvent = addEvent;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rethinkdb = require('rethinkdb');

var _rethinkdb2 = _interopRequireDefault(_rethinkdb);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _models = require('../models');

var _helpers = require('../helpers');

function loadOrCreate(conn, options, cb) {
  findOne(conn, options, function (err, transac) {
    if (err) return cb(err);
    if (!transac) return insertOne(conn, options, cb);
    if (transac.isLocked()) return cb(new _helpers.TransacError('Transaction already locked', 'locked'));
    if (transac.isCompound() && options.compound) {
      options.transacId = transac.transacId;
    }
    insertOne(conn, options, cb);
  });
}

// export to be tested

function findOne(conn, options, cb) {
  var query = _rethinkdb2['default'].table(_models.Transac.collection).filter({ label: options.label, type: 'transac' });

  if (options.valueDate) {
    (function () {
      var from = (0, _moment2['default'])(options.valueDate).startOf('day').toDate(),
          to = (0, _moment2['default'])(options.valueDate).endOf('day').toDate();

      query = query.filter(function (t) {
        return t('valueDate').during(from, to, { leftBound: 'closed', rightBound: 'closed' });
      });
    })();
  }

  if (options.compound) query = query.orderBy(_rethinkdb2['default'].asc('createdAt'));else query = query.orderBy(_rethinkdb2['default'].desc('createdAt'));

  query.run(conn, function (err, cursor) {
    if (err) return cb(err);
    cursor.toArray(function (err, transacs) {
      if (err) return cb(err);
      var transac = transacs[0];
      if (!transac) return cb();
      cb(null, (0, _models.bless)(transac));
    });
  });
}

function loadAll(conn, _x, cb) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];

  var label = _ref.label;
  var _ref$from = _ref.from;
  var from = _ref$from === undefined ? (0, _moment2['default'])().startOf('day').toDate() : _ref$from;
  var _ref$to = _ref.to;
  var to = _ref$to === undefined ? (0, _moment2['default'])().endOf('day').toDate() : _ref$to;
  var _ref$dateMode = _ref.dateMode;
  var dateMode = _ref$dateMode === undefined ? 'valueDate' : _ref$dateMode;

  function findAll(cb) {
    var query = _rethinkdb2['default'].table(_models.Transac.collection).filter(_rethinkdb2['default'].row(dateMode === 'valueDate' ? 'valueDate' : 'createdAt').during(from, to, { leftBound: 'closed', rightBound: 'closed' }));
    if (label) query = query.filter({ label: label });

    query.run(conn, function (err, cursor) {
      if (err) return cb(err);
      cursor.toArray(function (err, transacs) {
        if (err) return cb(err);
        var transacIds = _lodash2['default'].inject(transacs, function (res, transac) {
          res[transac.transacId] = transac.transacId;return res;
        }, {});
        cb(null, _lodash2['default'].keys(transacIds));
      });
    });
  }
  function loadTransacs(transacIds, cb) {
    _async2['default'].map(transacIds, load.bind(null, conn), cb);
  }

  _async2['default'].waterfall([findAll, loadTransacs], cb);
}

function load(conn, id, cb) {
  _rethinkdb2['default'].table(_models.Transac.collection).filter({ transacId: id }).orderBy(_rethinkdb2['default'].asc('createdAt')).run(conn, function (err, nodes) {
    if (err) return cb(err);
    var root = undefined,
        hnodes = _lodash2['default'].inject(nodes, function (res, node) {
      res[node.id] = node;return res;
    }, {});

    _lodash2['default'].each(nodes, function (node) {
      var tnode = (0, _models.bless)(node);
      if (tnode.isTransac() && tnode.isCompound()) {
        if (!root) root = new _models.Transac.makeCompoundRoot(tnode);
        root.addChild(tnode);
      } else {
        if (!tnode.parentId) root = tnode;else {
          var _parent = hnodes[tnode.parentId];
          if (!_parent) {
            console.log(tnode);
            return cb(new Error('Wrong Transac Tree'));
          }
          _parent.addChild(tnode);
        }
      }
    });
    cb(null, root);
  });
}

function insertOne(conn, options, cb) {
  var transac = new _models.Transac(options);
  _rethinkdb2['default'].table(_models.Transac.collection).insert(transac, { returnChanges: true }).run(conn, function (err, res) {
    if (err) return cb(err);
    cb(null, transac);
  });
}

function addEvent(conn, id, options, cb) {
  _async2['default'].waterfall([load.bind(null, conn, id), function (transac, cb) {
    if (!transac) return setImmediate(cb, new Error('Unknown transaction'));
    addEventTransac(conn, transac, options, function (err, event, transac) {
      if (err) return cb(err);
      addMessage(conn, transac, event, options, cb);
    });
  }], cb);
}

function addEventTransac(conn, transac, options, cb) {
  try {
    (function () {
      options.transacId = transac.id;
      var event = new _models.Event(options);
      transac.addEvent(event);
      _rethinkdb2['default'].table(_models.Transac.collection).insert(event, { returnChanges: true }).run(conn, function (err, res) {
        if (err) return cb(err);
        cb(null, event, transac);
      });
    })();
  } catch (e) {
    setImmediate(cb, e);
  }
}

function addMessage(conn, transac, event, options, cb) {
  try {
    var message = new _models.Message({ label: options.message, transacId: options.transacId });
    event.addChild(message);
    _rethinkdb2['default'].table(_models.Transac.collection).insert(message, { returnChanges: true }).run(conn, function (err, res) {
      if (err) return cb(err);
      cb(null, event, transac);
    });
  } catch (e) {
    setImmediate(cb, e);
  }
}
//# sourceMappingURL=../helpers/transac.js.map