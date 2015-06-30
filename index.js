'use strict';

var server = require('./dist/server');

exports.create = create;

function create(options, cb){
  var promise = server.create(options);
  if(!cb) return promise;
  else promise
    .then(function(app){ cb(null, app) })
    .catch(function(err){ cb(err) });
}
