'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _aureliaFramework = require('aurelia-framework');

var _loader = require('./loader');

var _loader2 = _interopRequireDefault(_loader);

var TransacList = (function () {
  function TransacList(loader) {
    _classCallCheck(this, _TransacList);

    this.loader = loader;
  }

  var _TransacList = TransacList;

  _createClass(_TransacList, [{
    key: 'activate',
    value: function activate() {
      this.loader.sayHello({ hello: 'world' }, function (err, res) {
        console.log(res);
      });
    }
  }]);

  TransacList = (0, _aureliaFramework.inject)(_loader2['default'])(TransacList) || TransacList;
  return TransacList;
})();

exports.TransacList = TransacList;
//# sourceMappingURL=../transacs/list.js.map