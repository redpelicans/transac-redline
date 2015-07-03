'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  http: {
    port: process.env.PORT || 3005
  },
  rethinkdb: {
    host: 'rethinkdb',
    db: 'transacs'
  }
};
module.exports = exports['default'];
//# sourceMappingURL=params.js.map