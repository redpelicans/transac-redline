'use strict';

var async = require('async')
  , redMongo = require('mongo-redline')
  , app = require('./app');

module.exports.start = function(options, cb){
  redMongo.connect(options, function(err) {
    if (err) return cb(err);

    app.start(function(err, expressApp){
      if(err) return cb(err);
      console.log('Ready to transac with U ...');
      cb(null, expressApp);
    });
  });
}
