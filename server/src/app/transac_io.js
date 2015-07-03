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
    function loadTransacs(params, cb){
      function handleChange(err, event){
        console.log("changes ....");
        if(err) return console.log(err);
        socket.emit('transacs:changes', event.new_val);
      }

      loginfo("socket.io loadTransacs ...");
      let options = {
          label: params.label
        , from: params.from && moment(params.from, FMT).startOf('day').toDate()
        , to: params.to && moment(params.to, FMT).startOf('day').toDate()
        , dateMode: params.mode == 'v' ? 'valueDate' : 'createdAt'
      }

      transacs.loadAll(resources.conn, options, (err, transacs) => {
        if(err) return cb(err);
        r.table('transacs').changes().run(resources.conn, (err, cursor) => cursor.each(handleChange) );
        cb(null, _.map(transacs, transac=>transac.toSummaryJSON()));
      });

    }

    socket.on('transacs:load', loadTransacs);
    
  })
}
