'use strict';

//var transac = require('transac-redline')
var async = require('async')
  , redMongo = require('mongobless')
  , express = require('express')
  , app = express()
  , morgan = require('morgan')
  , params = require('../params')
  , transac = require('./app');

  async.waterfall([mongoConnect(params.db), transacStart(params, transac)], function(err, transacApp){
    if(err){
      console.error(err);
      return process.exit(1);
    }

    console.log("HTTP server listening on port: " + params.http.port);
    app.use(express.static(__dirname + '/../' + params.frontendApp));
    app.use(morgan({format: 'dev', skip: function(req, res){
      var r = /\/ping/;
      return r.exec(req.url);
    }}));

    app.use('/', transacApp);

    app.use(function(err, req, res, next) {
      if (!err) return next();
      var message = err.message || err.toString();
      console.error(err.stack);
      res.status(500).json({message: message});
    })


    app.listen(params.http.port);
    console.log('Ready to transac with U ...');
    //console.log("To enable debug mode do 'kill -s USR1 " + process.pid + "'");
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

