import errors from '../middleware/errors';
import debug from 'debug';
import http from 'http';
import async from 'async';
import {default as logger} from 'morgan';
import {default as bodyParser} from 'body-parser';
import {default as cookieParser} from 'cookie-parser';
import express from 'express';

let logerror = debug('transac:error')
  , loginfo = debug('transac:info');

export function start(params, resources, cb) {
  let app = express()
    , httpServer = http.createServer(app);

  function stop(cb){
    httpServer.close(()=>{httpServer.unref(); cb()});
  }

  async.parallel({
    // init http depending on param.js
    http: function(cb){
      httpServer.listen(params.http.port, function() {
        loginfo(`HTTP server listening on port: ${params.http.port}`);
        cb();
      });
    }
  }, function(err){
    if(err)return cb(err);

    // register middleware, order matters

    // remove for security reason
    app.disable('x-powered-by');
    // usually node is behind a proxy, will keep original IP
    app.enable('trust proxy');

    // register bodyParser to automatically parse json in req.body and parse url
    // params
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    app.use(bodyParser.json({limit: '10mb', extended: true}));

    // manage cookie
    app.use(cookieParser());

    require('./ping').init(app, resources);
    require('./version').init(app, resources);

    // register morgan logger
    app.use(logger('dev'));

    app.use('/', require('./transac').init(app, resources));
    
    app.use(errors);

    cb(null, {stop: stop});
  });
}

