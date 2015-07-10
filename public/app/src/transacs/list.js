import {inject} from 'aurelia-framework';
import _ from 'lodash';
import TransacService from './service';

@inject(TransacService)
export class TransacList {
  constructor(service){
    this.transacService = service;
    this.transacs = [
      {label: 'test', server: 'rp', valueDate: new Date, createdAt: new Date(), delay:15}
    ];
    this.from = new Date(2014,1,1);
    this.to = new Date();
    this.dateMode = "Processing Date";
    this.dateModes = ["Processing Date", "Value Date"];
    this.sortColumn = 'name';
    this.sortOrder = 'asc';
  }

  reverseSortOrder(){
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  sortTable(column){
    if(this.sortColumn === column) this.reverseSortOrder();
    this.sortColumn = column;
    this.doSortTable();
  }

  doSortTable(){
    this.transacs = _.sortByOrder(this.transacs, [this.sortColumn], [this.sortOrder]);
  }

  loadData(){
    function transacUpdates(event){
      console.log("transacs:event");
      console.log(event);
    }

    let params = {
      from: moment(this.from).format('DD/MM/YYYY'),
      to: moment(this.to).format('DD/MM/YYYY'),
      dateMode: this.dateMode === 'Value Date' ? 'valueDate' : 'createdAt'
    };

    //console.log(params);
    this.unsubscribeHandler = this.transacService.subscribe(transacUpdates);
    return this.transacService.load(params)
      .then(transacs => {
        if(transacs){ 
          //this.transacs = transacs;
          this.doSortTable();
          console.log(transacs)
        }
      })
      // TODO
      .catch(err => console.log(err));
  }

  activate(params){
    return this.loadData();
  }

}
