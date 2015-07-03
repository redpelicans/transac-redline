"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configure = configure;

function configure(aurelia) {
  aurelia.use.standardConfiguration().developmentLogging();
  //.plugin('aurelia-animator-css');

  aurelia.start().then(function (a) {
    return a.setRoot();
  });
}
//# sourceMappingURL=transac_main.js.map