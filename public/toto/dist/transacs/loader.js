'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _socketIoClient = require('socket.io-client');

var _socketIoClient2 = _interopRequireDefault(_socketIoClient);

var TransacLoader = (function () {
  function TransacLoader() {
    _classCallCheck(this, TransacLoader);

    console.log('init socket IO ...');
    this.socket = (0, _socketIoClient2['default'])();
  }

  _createClass(TransacLoader, [{
    key: 'sayHello',
    value: function sayHello(msg, cb) {
      this.socket.emit('news', msg, cb);
    }
  }]);

  return TransacLoader;
})();

exports['default'] = TransacLoader;
module.exports = exports['default'];
//# sourceMappingURL=../transacs/loader.js.map