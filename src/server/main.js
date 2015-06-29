import params from './params';
import * as server from './index';
import debug from 'debug';

require('better-log').install();

let logerror = debug('transac:error')
  , loginfo = debug('transac:info');

server.create(params)
  .then(transac =>{ 
    loginfo("Ready to transac with U ...")
  }).catch(err => { throw err });

