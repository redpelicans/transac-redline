import {Transac} from '../models';
import {TransacError} from '../helpers';
import {dmy, FMT} from '../helpers';
import * as transacs from '../helpers/transac';
import async from 'async';
import util from 'util';
import moment from 'moment';
import _ from 'lodash';
import debug from 'debug';
import r from 'rethinkdb';

let logerror = debug('transac:error')
  , loginfo = debug('transac:info');

export function init(params, resources){
  resources.io.on('connection', socket => {

    function manageOptions({label, from, to, dateMode='valueDate'} = {}){
      from = from ? moment(from, FMT).startOf('day').toDate() : moment().startOf('day').toDate();
      to = to ? moment(to, FMT).endOf('day').toDate() : moment().endOf('day').toDate();
      dateMode = dateMode === 'valueDate' ? 'valueDate' : 'createdAt';
      return { label: label, from: from, to: to, dateMode: dateMode };
    }

    function loadTransacs(options, cb){
      loginfo("socket.io loadTransacs ...");
      let params = manageOptions(options);
      let query =  r.table(Transac.collection).filter( 
        r.row(params.dateMode).during(params.from, params.to, {leftBound: "closed", rightBound: "closed"}) 
      );
      if(params.label) query = query.filter({label: params.label});

      query.run(resources.conn, (err, cursor) => {
        if(err) return cb(err);
        cursor.toArray((err, transacs) => {
          if(err) return cb(err);
          cb(null, transacs);
        })
      })
    }

    function subscribeTransacs(){
      loginfo("socket.io subscribeTransacs ...");
      r.table(Transac.collection).changes().run(resources.conn, (err, cursor) => {
        if(err) return logerror(err);
        cursor.each((err, event) => {
          if(err) return logerror(err);
          console.log(event.new_val);
          socket.emit('transacs:event', event.new_val);
        })
      })
    }

    subscribeTransacs();
    socket.on('transacs:load', loadTransacs);

  })
}
