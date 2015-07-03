import r from 'rethinkdb';
import async from 'async';
import debug from 'debug';
import _ from 'lodash';

let logerror = debug('transac:error')
  , loginfo = debug('transac:info');

export default {init: init};

let tables = {
    transacs: 'id'
};

function init(params, resources){

  function initConnection(cb){
    r.connect(params, (err, conn) => {
      if(err) return cb(err);
      conn.on('error', err => {
        logerror("RethinkDB connection lost");
        logerror(err);
        conn.reconnect({noreplyWait: false}, (err, conn) => {
          if(err) return logerror(err);
          loginfo("RethinkDB has reconnected");
          resources.conn = conn;
        });
      });
      loginfo(`RethinkDB connected to database '${params.db}'`);
      cb(null, conn);
    })
  }

  function dbCreate(conn, cb){
    r.dbList().run(conn, (err, result) => {
      if(err) return cb(err);
      if(_.contains(result, params.db))return setImmediate(cb, null, conn);
      r.dbCreate(params.db).run(conn, (err, result) => {
        if(err) return cb(err);
        loginfo(`RethinkDB database ${params.db} created`);
        cb(null, conn);
      })
    });
  }

  function tablesCreate(conn, cb){
    async.map(_.pairs(tables), tableCreate(conn), err => { cb(err, conn) });
  }

  function tableCreate(conn){
    return function(x, cb){
      let [table, index] = x;
      r.db(params.db).tableList().run(conn, (err, result) => {
        if(err) return cb(err);
        if(_.contains(result, table))return setImmediate(cb);
        r.db(params.db).tableCreate(table, {primaryKey: index}).run(conn, err => {
          if(err) return cb(err);
          loginfo(`RethinkDB database '${params.db}' table '${table}' created`);
          cb();
        });
      });
    }
  }

  return function(cb){
    async.waterfall([initConnection, dbCreate, tablesCreate], (err, conn) => {
      cb(err, conn);
    });
  }

}
