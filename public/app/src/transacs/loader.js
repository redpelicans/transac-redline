import io from 'socket.io-client';

export default class TransacLoader {
  constructor(){
    console.log('init socket IO ...');
    this.socket = io();
  }

  sayHello(msg, cb){
    this.socket.emit('news', msg, cb);
  }
}
