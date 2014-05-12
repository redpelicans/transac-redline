'use strict';

//var transac = require('transac-redline')
var async = require('async')
  , redMongo = require('mongo-redline')
  , express = require('express')
  , app = express()
  , morgan = require('morgan')
  , params = require('../params')
  , transac = require('./app');

  async.waterfall([mongoConnect(params.db), transacStart(params, transac)], function(err, transacApp){
    if(err){
      console.err(err);
      return process.exit(1);
    }

    console.log("HTTP server listening on port: " + params.http.port);
    //app.use(express.static(__dirname + '../frontend'));
    app.use(express.static(__dirname + '/../' + params.frontendApp));
    // app.use(require('connect-livereload')({
    //   port: 35729
    // }));
    app.use(morgan('dev'));
    app.use('/', transacApp);
    app.listen(params.http.port);
    console.log('Ready to transac with U ...');
    console.log("To enable debug mode do 'kill -s USR1 " + process.pid + "'");
  });

function mongoConnect(options){
  return function(cb){
    redMongo.connect(options, cb);
  }
}

function transacStart(options, transac){
  return function(db, cb){
    transac.start(cb);
  }
}

