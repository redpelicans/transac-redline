import {computedFrom} from 'aurelia-framework';
import _ from 'lodash';
import moment from 'moment';

export function makeNode(obj){
  if(!obj)return;
  switch(obj.type){
    case 'transac':
      return new Transac(obj);
    case 'event':
      return new Event(obj);
    case 'message':
      return new Event(obj);
  }
  return obj;
}

class Node {
  constructor({id, label, transacId, parentId, type, createdAt} = {}){
    this.id = id;
    this.createdAt = moment(createdAt);
    this.transacId = transacId;
    if(parentId) this.parentId = parentId;
    this.type = type;
    this.label = label;
  }

  isTransac(){
    return this.type === 'transac';
  }

  isEvent(){
    return this.type === 'event';
  }

  isMessage(){
    return this.type === 'message';
  }


  get children(){
    return this._children || [];
  }

  addChild(node){
    if(!this._children) this._children = [];
    this._children.push(node);
    node.parentId = this.id;
    return this;
  }

  isLeaf(){
    return !this.length;
  }

  [Symbol.iterator](){
    let done = {}, node, remainingNodes = [this];
    function iterate(nodes){
      let child = nodes[0];
      if(!child) return [null, []];
      if(child.isLeaf() || done[child.id]) return [child, nodes.slice(1)];
      nodes.splice(0, 0, ...child.children);
      done[child.id] = true;
      return iterate(nodes);
    }

    return {
      [Symbol.iterator](){
        return this;
      },
      next(){
        [node, remainingNodes] =  iterate(remainingNodes);
        if(node)return {value: node};
        else return {done: true};
      }
    }
  }

  get status(){
    if(this.hasStatuses(['error', 'abort'])) return 'error';
    if(this.hasStatuses(['warning'])) return 'warning';
    return 'ok';
  }

  hasStatuses(statuses){
    return _.some(this.children, function(child){return _.contains(statuses, child.status)});
  }

  hasLevel(level){
    return _.some(this.children, function(child){return child.level === level});
  }

  get length(){
    return this.children.length;
  }

  get lastChild(){
    return this.children && this.children[this.length - 1];
  }

  get lastMessage(){
    // BUG with Babel
    //let nodes = _.filter([...this], node => node.isMessage());
    let nodes = [];
    for (let node of this) if(node.isMessage()) nodes.push(node); 
    return nodes[nodes.length-1];
  }

  get lastMessageTime(){
    let lastMessage = this.lastMessage;
    return lastMessage && lastMessage.createdAt;
  }

}

export class Transac extends Node {

  constructor(options){
    super(options);
    if(options.valueDate) this.valueDate = moment(options.valueDate, "DD/MM/YYYY");
    _.extend(this, _.pick(options, 'server', 'user', 'processId', 'locked', 'compound'));
  }

  isCompound(){
    return this.compound;
  }

  //@computedFrom('locked')
  isLocked(){
    return this.locked;
  }

  isRunning(){
    //return !this.hasStatuses(['abort', 'commit']);
    let lastMessage = this.lastMessage;
    return !lastMessage || !_.contains(['abort', 'commit'], lastMessage.level);
  }

  get delay(){
    let lastMessage = this.lastMessage;
    if(lastMessage) return lastMessage.createdAt - this.createdAt;
    else return 0;
  }

  //@computedFrom('status')
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
 
  //@computedFrom('isRunning')
  get isRunningIcon(){
    return (this.isRunning ? 'glyphicon glyphicon-time green-icon' : 'glyphicon glyphicon-remove orange-icon');
  }

  //@computedFrom('isMulti')
  get isMultiIcon(){
    if(this.isMulti) return 'glyphicon glyphicon-th-large blue-icon';
  }

  //@computedFrom('locked')
  get isLockIcon(){
    if(this.locked) return 'glyphicon glyphicon-lock gray-icon';
  }

}

export class Event extends Node{
  constructor(options){
    super(options);
  }
}

export class Message extends Node{
  constructor(options){
    super(options);
    this.level = options.level;
  }

  get status(){
    if(this.level === 'abort' || this.level === 'error') return 'error';
    if(this.level === 'warning') return 'warning';
    return 'ok';
  }

}



