import {computedFrom} from 'aurelia-framework';

export default class Transac{

  @computedFrom('status')
  get statusIcon(){
    switch(this.status){
      case 'ok':
        return 'glyphicon glyphicon-chevron-down green-icon';
      case 'warning':
        return 'glyphicon glyphicon-warning-sign orange-icon';
      case 'error':
        return 'glyphicon glyphicon-minus-sign red-icon';
    }
  }
 
  @computedFrom('isRunning')
  get isRunningIcon(){
    return (this.isRunning ? 'glyphicon glyphicon-time green-icon' : 'glyphicon glyphicon-remove orange-icon');
  }

  @computedFrom('isMulti')
  get isMultiIcon(){
    if(this.isMulti) return 'glyphicon glyphicon-th-large blue-icon';
  }

  @computedFrom('locked')
  get isLockIcon(){
    if(this.locked) return 'glyphicon glyphicon-lock gray-icon';
  }

}
