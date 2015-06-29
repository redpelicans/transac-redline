'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.init = init;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _models = require('../models');

var _helpers = require('../helpers');

var _helpersTransac = require('../helpers/transac');

var transacs = _interopRequireWildcard(_helpersTransac);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function init(params, $, cb) {
  var app = (0, _express2['default'])();

  app.get('/transacs', loadTransacs);
  app.get('/transacs/:id', loadTransac);
  app.post('/transacs', createTransac);
  app.put('/transacs/:id/events', createEvent);

  function loadTransacs(req, res, next) {
    var options = {
      label: req.query.label,
      from: req.query.from && (0, _moment2['default'])(req.query.from, _helpers.FMT).startOf('day').toDate(),
      to: req.query.to && (0, _moment2['default'])(req.query.to, _helpers.FMT).startOf('day').toDate(),
      dateMode: req.query.mode == 'v' ? 'valueDate' : 'createdAt'
    };

    transacs.loadAll($.conn, options, function (err, transacs) {
      if (err) return next(err);
      res.json(_lodash2['default'].map(transacs, function (transac) {
        return transac.toSummaryJSON();
      }));
    });
  }

  function loadTransac(req, res, next) {
    var transacId = req.params.id;
    transacs.load($.conn, transacId, function (err, transac) {
      if (err) return next(err);
      if (!transac) return new Error('Unknown transac');
      res.json(transac.toJSON());
    });
  }

  function createTransac(req, res, next) {
    var options = req.body;
    if ('valueDate' in options) options.valueDate = (0, _moment2['default'])(options.valueDate, _helpers.FMT).toDate();
    if ('locked' in options) options.locked = options.locked === 'true';
    if ('compound' in options) options.compound = options.compound === 'true';
    if ('processId' in options) options.processId = +options.processId;

    transacs.loadOrCreate($.conn, options, function (err, transac) {
      if (err) return next(err);
      res.json(transac.toSummaryJSON());
    });
  }

  function createEvent(req, res, next) {
    var transacId = req.params.id,
        options = _lodash2['default'].pick(req.body, 'level', 'label', 'messages');

    transacs.addEvent($.conn, transacId, options, function (err, transac) {
      if (err) {
        if (err instanceof _helpers.TransacError) res.status(418).json(err);else next(err);
      } else res.status(200).end();
    });
  }

  return app;
}
//# sourceMappingURL=../app/transac.js.map