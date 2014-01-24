'use strict';

var transac = require('..')
  , express = require('express')
  , connect = require('connect')
  , http = require('http')
  , app = express()
  , params = require('./params')
  , httpServer = http.createServer(app);

transac.start(params.transac, function(err, transacApp){
  httpServer.listen(params.http.port, function() {
    console.log("HTTP server listening on port: " + params.http.port);

    app.use(express.bodyParser());
    app.use(connect.logger('short'));
    app.use('/', transacApp);
  });
});

