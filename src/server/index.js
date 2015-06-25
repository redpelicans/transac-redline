import r from 'rethinkdb';
import async from 'async';
import debug from 'debug';
import * as app  from './app';
import rdb from './init/rdb';
import githash from './init/githash';

let logerror = debug('transac:error')
  , loginfo = debug('transac:info');

let resources = {};
    
const version = require('../../package.json').version;

export function create(params){
  let promise = new Promise( (resolve, reject) => {
    async.parallel({
      conn: rdb.init(params.rethinkdb),
      githash: githash.init(params.rethinkdb)
    }, (err, init) => {
      if(err) reject(err);
      resources.conn = init.conn;
      resources.version = version;
      resources.githash = init.githash;
      app.start(params, resources, (err, server) => {
        if(err) reject(err);
        resolve(server);
      });
    });
  });
  return promise;
}

function initRDB(params, resources){
  return function(cb){
    r.connect(params, (err, conn) => {
      if(err) return cb(err);
      conn.on('error', err => {
        logerror("Rethinkdb lost connection");
        logerror(err);
        conn.reconnect({noreplyWait: false}, (err, conn) => {
          if(err) return logerror(err);
          loginfo("Rethinkdb has reconnected");
          resources.conn = conn;
        });
      });
      loginfo(`Rethinkdb connected to database '${params.db}'`);
      cb(null, conn);
    })
  }
}
