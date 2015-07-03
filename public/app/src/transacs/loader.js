import io from 'socket.io-client';

export default class TransacLoader {
  constructor(){
    console.log('Init socket IO ...');
    this.socket = io("http://rp1.redpelicans.com:3005");
  }

  loadTransacs(params, update, cb){
    this.socket.emit('transacs:load', params, cb);
    this.socket.on('transacs:changes', function(transac){
      update(transac);
    });
  }
}
