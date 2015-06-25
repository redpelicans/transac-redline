import * as server from './dist/server';
export function create(options, cb){
  let promise = server.create(options);
  if(!cb) return promise;
  else promise.then((app) => cb(null, app)).catch(err => cb(err));
}
