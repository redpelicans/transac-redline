'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = _interopRequireDefault(_lodash);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _helpers = require('../helpers');

var Transac = function Transac() {
  var _ref = arguments[0] === undefined ? {} : arguments[0];

  var name = _ref.name;
  var _ref$valueDate = _ref.valueDate;
  var valueDate = _ref$valueDate === undefined ? (0, _moment2['default'])().startOf('day').toDate() : _ref$valueDate;
  var server = _ref.server;
  var user = _ref.user;
  var processId = _ref.processId;
  var _ref$locked = _ref.locked;
  var locked = _ref$locked === undefined ? false : _ref$locked;
  var _ref$compound = _ref.compound;
  var compound = _ref$compound === undefined ? false : _ref$compound;

  _classCallCheck(this, Transac);

  this.id = (0, _uuid2['default'])();
  this.name = name;
  this.valueDate = valueDate;
  this.processingTime = new Date();
  if (server) this.server = server;
  if (user) this.user = user;
  if (processId) this.processId = processId;
  if (compound) {
    this.compound = true;
    this.groupId = this.id;
  }
  this.events = [];
};

exports.Transac = Transac;
//# sourceMappingURL=../models/transac.js.map