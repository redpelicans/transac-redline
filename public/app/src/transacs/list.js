import {inject} from 'aurelia-framework';
import TransacLoader from './loader';

@inject(TransacLoader)
export class TransacList {
  constructor(loader){
    this.loader = loader;
  }

  activate(){
    this.loader.sayHello({hello: 'world' }, (err, res) => {
      console.log(res);
    });
  }
}
