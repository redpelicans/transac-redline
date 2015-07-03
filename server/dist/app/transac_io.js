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

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function init(params, resources) {
  resources.io.on('connection', function (socket) {
    function loadTransacs(params, cb) {
      var options = {
        label: params.label,
        from: params.from && (0, _moment2['default'])(params.from, _helpers.FMT).startOf('day').toDate(),
        to: params.to && (0, _moment2['default'])(params.to, _helpers.FMT).startOf('day').toDate(),
        dateMode: params.mode == 'v' ? 'valueDate' : 'createdAt'
      };

      transacs.loadAll(resources.conn, options, function (err, transacs) {
        if (err) return cb(err);
        cb(null, _lodash2['default'].map(transacs, function (transac) {
          return transac.toSummaryJSON();
        }));
      });
    }

    socket.on('transacs', loadTransacs);
    socket.on('news', function (data, cb) {
      console.log('===> IO.NEWS');
      console.log(_util2['default'].inspect(data, { depth: 5 }));
      console.log(cb);
      cb(null, { msg: 'coucou' });
    });
  });
}
//# sourceMappingURL=../app/transac_io.js.map