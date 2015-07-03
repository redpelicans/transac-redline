import {Transac} from '../models';
import {TransacError} from '../helpers';
import {dmy, FMT} from '../helpers';
import * as transacs from '../helpers/transac';
import async from 'async';
import util from 'util';
import moment from 'moment';
import _ from 'lodash';

export function init(params, resources){
  resources.io.on('connection', socket => {
    function loadTransacs(params, cb){
      let options = {
          label: params.label
        , from: params.from && moment(params.from, FMT).startOf('day').toDate()
        , to: params.to && moment(params.to, FMT).startOf('day').toDate()
        , dateMode: params.mode == 'v' ? 'valueDate' : 'createdAt'
      }

      transacs.loadAll(resources.conn, options, (err, transacs) => {
        if(err) return cb(err);
        cb(null, _.map(transacs, transac=>transac.toSummaryJSON()));
      });

    }

    socket.on('transacs', loadTransacs);
    socket.on('news', (data, cb) =>{
      console.log(`===> IO.NEWS`);
     console.log(util.inspect(data, {depth: 5}));
     console.log(cb);
      cb(null, {msg: 'coucou'});
    });
    
  })
}
