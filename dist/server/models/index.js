'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.bless = bless;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = _interopRequireDefault(_lodash);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _helpers = require('../helpers');

var Node = (function () {
  function Node() {
    var _ref2 = arguments[0] === undefined ? {} : arguments[0];

    var label = _ref2.label;
    var transacId = _ref2.transacId;
    var parentId = _ref2.parentId;
    var type = _ref2.type;

    _classCallCheck(this, Node);

    this.id = (0, _uuid2['default'])();
    this.createdAt = new Date();
    this.transacId = transacId;
    if (parentId) this.parentId = parentId;
    this.type = type;
    this.label = label;
  }

  _createClass(Node, [{
    key: 'isTransac',
    value: function isTransac() {
      return this.type === 'transac';
    }
  }, {
    key: 'isEvent',
    value: function isEvent() {
      return this.type === 'event';
    }
  }, {
    key: 'isMessage',
    value: function isMessage() {
      return this.type === 'message';
    }
  }, {
    key: 'children',
    get: function () {
      return this._children || [];
    }
  }, {
    key: 'addChild',
    value: function addChild(node) {
      if (!this._children) this._children = [];
      this._children.push(node);
      node.parentId = this.id;
      return this;
    }
  }, {
    key: 'isLeaf',
    value: function isLeaf() {
      return !this.length;
    }
  }, {
    key: Symbol.iterator,
    value: function () {
      var _ref;

      var done = {},
          node = undefined,
          remainingNodes = [this];
      function iterate(_x8) {
        var _again2 = true;

        _function2: while (_again2) {
          var nodes = _x8;
          child = undefined;
          _again2 = false;

          var child = nodes[0];
          if (!child) return [null, []];
          if (child.isLeaf() || done[child.id]) return [child, nodes.slice(1)];
          nodes.splice.apply(nodes, [0, 0].concat(_toConsumableArray(child.children)));
          done[child.id] = true;
          _x8 = nodes;
          _again2 = true;
          continue _function2;
        }
      }

      return (_ref = {}, _defineProperty(_ref, Symbol.iterator, function () {
        return this;
      }), _defineProperty(_ref, 'next', function next() {
        var _iterate = iterate(remainingNodes);

        var _iterate2 = _slicedToArray(_iterate, 2);

        node = _iterate2[0];
        remainingNodes = _iterate2[1];

        if (node) return { value: node };else return { done: true };
      }), _ref);
    }
  }, {
    key: 'status',
    get: function () {
      if (this.hasStatuses(['error', 'abort'])) return 'error';
      if (this.hasStatuses(['warning'])) return 'warning';
      return 'ok';
    }
  }, {
    key: 'hasStatuses',
    value: function hasStatuses(statuses) {
      return _lodash2['default'].some(this.children, function (child) {
        return _lodash2['default'].contains(statuses, child.status);
      });
    }
  }, {
    key: 'length',
    get: function () {
      return this.children.length;
    }
  }, {
    key: 'lastChild',
    get: function () {
      return this.children && this.children[this.length - 1];
    }
  }, {
    key: 'lastEventTime',
    get: function () {
      return this.Child && this.lastChild.createdAt;
    }
  }]);

  return Node;
})();

function bless(obj) {
  if (!obj) return;
  switch (obj.type) {
    case 'transac':
      obj.__proto__ = Transac.prototype;
      break;
    case 'event':
      obj.__proto__ = Event.prototype;
      break;
    case 'message':
      obj.__proto__ = Message.prototype;
      break;
  }
  return obj;
}

var Transac = (function (_Node) {
  function Transac() {
    var _ref3 = arguments[0] === undefined ? {} : arguments[0];

    var label = _ref3.label;
    var _ref3$valueDate = _ref3.valueDate;
    var valueDate = _ref3$valueDate === undefined ? (0, _moment2['default'])().startOf('day').toDate() : _ref3$valueDate;
    var parentId = _ref3.parentId;
    var server = _ref3.server;
    var user = _ref3.user;
    var processId = _ref3.processId;
    var _ref3$locked = _ref3.locked;
    var locked = _ref3$locked === undefined ? false : _ref3$locked;
    var _ref3$compound = _ref3.compound;
    var compound = _ref3$compound === undefined ? false : _ref3$compound;
    var transacId = _ref3.transacId;

    _classCallCheck(this, Transac);

    _get(Object.getPrototypeOf(Transac.prototype), 'constructor', this).call(this, { label: label, parentId: parentId, transacId: transacId, type: 'transac' });
    if (!this.transacId) this.transacId = this.id;
    this.valueDate = valueDate;
    if (server) this.server = server;
    if (user) this.user = user;
    if (processId) this.processId = processId;
    if (locked) this.locked = locked;
    if (compound) {
      this.compound = true;
    };
  }

  _inherits(Transac, _Node);

  _createClass(Transac, [{
    key: 'addEvent',

    // to keep compatible with older version
    value: function addEvent(event) {
      var transac = this;
      if (transac.lastChild && transac.lastChild.isTransac()) return transac.lastChild.addEvent(event);
      transac.addChild(event);
      return this;
    }
  }, {
    key: 'isCompound',
    value: function isCompound() {
      return this.compound;
    }
  }, {
    key: 'isLocked',
    value: function isLocked() {
      return this.locked;
    }
  }, {
    key: 'isRunning',
    value: function isRunning() {
      return !this.hasStatuses(['abort', 'commit']);
    }
  }, {
    key: 'delay',
    get: function () {
      if (this.lastChild) return this.lastChild.createdAt - this.createdAt;else return 0;
    }
  }, {
    key: 'toSummaryJSON',
    value: function toSummaryJSON() {
      return {
        id: this.id,
        transacId: this.transacId,
        label: this.label,
        valueDate: (0, _helpers.dmy)(this.valueDate),
        createdAt: +this.createdAt,
        lastEventTime: this.lastEventTime && +this.lastEventTime,
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isCompound: this.isCompound(),
        server: this.server,
        delay: this.delay
      };
    }
  }], [{
    key: 'collection',
    get: function () {
      return 'transacs';
    }
  }, {
    key: 'makeCompoundRoot',
    value: function makeCompoundRoot(transac) {
      var root = new Transac({ label: transac.label, valueDate: transac.valueDate, compound: true, transacId: transac.transacId });
      root._children = [];
      root.root = true;
      return root;
    }
  }]);

  return Transac;
})(Node);

exports.Transac = Transac;

var Event = (function (_Node2) {
  function Event() {
    var _ref4 = arguments[0] === undefined ? {} : arguments[0];

    var transacId = _ref4.transacId;
    var parentId = _ref4.parentId;
    var _ref4$level = _ref4.level;
    var level = _ref4$level === undefined ? 'ok' : _ref4$level;
    var label = _ref4.label;

    _classCallCheck(this, Event);

    _get(Object.getPrototypeOf(Event.prototype), 'constructor', this).call(this, { label: label, transacId: transacId, parentId: parentId, type: 'event' });
    this.level = level;
  }

  _inherits(Event, _Node2);

  _createClass(Event, [{
    key: 'status',
    get: function () {
      if (this.level === 'abort' || this.level === 'error') return 'error';
      if (this.level === 'warning') return 'warning';
      return 'ok';
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        label: this.label,
        createdAt: +this.createdAt,
        type: this.type
      };
    }
  }]);

  return Event;
})(Node);

exports.Event = Event;

var Message = (function (_Node3) {
  function Message() {
    var _ref5 = arguments[0] === undefined ? {} : arguments[0];

    var transacId = _ref5.transacId;
    var parentId = _ref5.parentId;
    var _ref5$level = _ref5.level;
    var level = _ref5$level === undefined ? 'ok' : _ref5$level;
    var label = _ref5.label;

    _classCallCheck(this, Message);

    _get(Object.getPrototypeOf(Message.prototype), 'constructor', this).call(this, { label: label, transacId: transacId, parentId: parentId, type: 'message' });
    this.level = level;
  }

  _inherits(Message, _Node3);

  _createClass(Message, [{
    key: 'status',
    get: function () {
      if (this.level === 'abort' || this.level === 'error') return 'error';
      if (this.level === 'warning') return 'warning';
      return 'ok';
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        label: this.label,
        createdAt: +this.createdAt,
        type: this.type
      };
    }
  }]);

  return Message;
})(Node);

exports.Message = Message;
//# sourceMappingURL=../models/index.js.map