import {inject} from 'aurelia-framework';
import TransacLoader from './loader';

@inject(TransacLoader)
export class TransacList {
  constructor(loader){
    this.loader = loader;
    this.transacs = [];
  }

  activate(){
    function updates(transac){
      console.log('updates ...');
      this.transacs.push(transac);
    }

    this.loader.loadTransacs({}, updates.bind(this), (err, res) => {
      if(res){
        console.log(res);
        this.transacs = res;
      }
    });
  }
}
