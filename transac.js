'use strict';
var redMongo = require('mongo-redline')
    , ObjectID = redMongo.ObjectID
    , moment = require('moment')
    , async = require('async')
    , _ = require('underscore');

var Event = function(options){
  this.time = new Date();
  this.type = options.type;
  this.label = options.label;
  this.message = options.message;
}

Event.prototype = {
  toJSON: function(){
    return {
      label: this.label,
      time: moment(this.time).format("YYYY/MM/DD HH:mm:ss"),
      type: this.type,
      message: this.message
    }
  }
}

var ElementaryTransac = function(options){
  this.processingTime = new Date();
  if(options.server) this.server = options.server;
  if(options.user) this.user = options.user;
  if(options.processId) this.processId = options.processId;
  this.events = [];
  this.status = 'ok';
}

var ElementaryTransacProto = {

  toJSON: function(){
    return {
      processingTime: moment(this.processingTime).format("YYYY/MM/DD HH:mm:ss"),
      status: this.status,
      isRunning: this.isRunning(),
      server: this.server,
      user: this.user,
      processId: this.processId,
      delay: this.delay,
      events: _.map(this.events, function(event){return event.toJSON()})
    }
  },

  hasEventTypes: function(types){
    return _.some(this.events, function(event){return _.contains(types, event.type)});
  },

  isRunning: function(){
    return !this.hasEventTypes(['abort', 'commit']);
  },

  // get status(){
  //   if(!this.lastEvent) return 'ok';
  //   if(this.hasEventTypes(['error'])) return 'error';
  //   if(this.hasEventTypes(['warning'])) return 'warning';
  //   return 'ok';
  // },

  get lastEvent(){
    return this.events[this.events.length - 1];
  },

  get delay(){
    if(this.lastEvent) return this.lastEvent.time - this.processingTime;
    else return 0;
  },

  computeStatus: function(event){
    switch(event.type){
      case 'error':
      case 'abort':
        this.status = 'error';
        break;
      case 'warning':
        if(this.status == 'ok')this.status = 'warning';
    }
    return this.status;
  }
}

ElementaryTransac.prototype = ElementaryTransacProto;

var Transac = redMongo.defineModel({
  collection: "transacs",
  instanceMethods: {
    isLocked: function(){
      return this.locked;
    },

    isMulti: function(){
      return this.type == 'multi';
    },

    toSummaryJSON: function(){
      return {
        id: this._id,
        name: this.name,
        valueDate: moment(this.valueDate).format("YYYY/MM/DD"),
        processingTime: moment(this.processingTime).format("YYYY/MM/DD HH:mm:ss"),
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isMulti: this.isMulti(),
        server: this.server,
        delay: this.delay
      }
    }
  }
})

module.exports = Transac;

Transac.factory = function(options){
  return options.nested ? new MultiTransac(options) : new PlainTransac(options);
}

Transac.bless = function(transac){
  switch( transac.type ){
    case 'plain':
      var obj = redMongo.Model.bless.bind(PlainTransac)(transac);
      _.each(obj.events, function(event){
        event.__proto__ = Event.prototype;
      });
      return obj;
    case 'multi':
      var obj = redMongo.Model.bless.bind(MultiTransac)(transac);
      _.each(obj.nestedTransacs, function(nt){ 
        nt.__proto__ = ElementaryTransacProto 
        _.each(nt.events, function(event){
          event.__proto__ = Event.prototype;
        });
      });
      return obj;
  }
}

var PlainTransac = redMongo.defineModel({

  extends: Transac,

  mixins: [ElementaryTransacProto],

  instanceMethods: {

    toJSON: function(){
      return {
        id: this._id,
        name: this.name,
        valueDate: moment(this.valueDate).format("YYYY/MM/DD"),
        processingTime: moment(this.processingTime).format("YYYY/MM/DD HH:mm:ss"),
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isMulti: this.isMulti(),
        server: this.server,
        user: this.user,
        processId: this.processId,
        delay: this.delay,
        events: _.map(this.events, function(event){return event.toJSON()})
      }
    },

    addEvent: function(event, cb){
      var transac = this;
      if(!transac.isRunning()) return setImmediate(cb, {message: "Can't add an event on a non running transac", code: 'closed'});
      Transac.collection.update({_id: transac._id}, {$set: {status: transac.computeStatus(event)}, $push: {events: event}}, function(err){
        if(err)return cb(err);
        transac.events.push(event);
        cb(null, event);
      });
    },

  },

  staticMethods: {
    init: function(options){
      var options = fillOptions(options);
      this.type = 'plain';
      this.name = options.name;
      this.valueDate = options.valueDate;
      this.processingTime = new Date();
      if(options.server) this.server = options.server;
      if(options.user) this.user = options.user;
      if(options.processId) this.processId = options.processId;
      this.events = [];
      this.locked = options.locked;
      this.status = 'ok';
    }
  }
});

var MultiTransac = redMongo.defineModel({
  extends: Transac,

  instanceMethods: {

    toJSON: function(){
      return {
        id: this._id,
        name: this.name,
        valueDate: moment(this.valueDate).format("YYYY/MM/DD"),
        processingTime: moment(this.processingTime).format("YYYY/MM/DD HH:mm:ss"),
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isMulti: this.isMulti(),
        server: this.server,
        delay: this.delay,
        nested: _.map(this.nestedTransacs, function(nt){return nt.toJSON()}),
      }
    },

    addEvent: function(event, cb){
      var transac = this;
      if(!transac.isRunning()) return setImmediate(cb, {message: "Can't add an event on a non running transac", code: 'closed'});
      var count = transac.nestedTransacs.length - 1
        , newStatus =  transac.lastElementaryTransac.computeStatus(event)
        , statusField = 'nestedTransacs.' + count + '.status'
        , eventField = 'nestedTransacs.' + count + '.events'
        , statusQuery = {}
        , eventQuery = {};

      statusQuery[statusField] = newStatus;
      eventQuery[eventField] = event;


      Transac.collection.update({_id: transac._id}, {$set: statusQuery, $push: eventQuery}, function(err){
        if(err) return cb(err);
        transac.lastElementaryTransac.events.push(event);
        cb(null, event);
      });
    },

    addNestedTransac: function(transac){
      this.nestedTransacs.push(transac);
    },

    get lastElementaryTransac(){
      return this.nestedTransacs[this.nestedTransacs.length - 1];
    },

    isRunning: function(){
      return this.lastElementaryTransac.isRunning();
    },

    get status(){
      if(_.some(this.nestedTransacs, function(transac){return transac.status == 'error' })) return 'error';
      if(_.some(this.nestedTransacs, function(transac){return transac.status == 'warning' })) return 'warning';
      return 'ok';
    },

    get delay(){
      return _.inject(this.nestedTransacs, function(sum, transac){ return sum + transac.delay }, 0);
    },

    get server(){
      return this.lastElementaryTransac.server;
    },

    get user(){
      return this.lastElementaryTransac.user;
    },

    get processId(){
      return this.lastElementaryTransac.processId;
    }
  },

  staticMethods: {
    init: function(options){
      this.type = 'multi';
      this.name = options.name;
      this.valueDate = options.valueDate;
      this.processingTime = new Date();
      this.nestedTransacs = [new ElementaryTransac(options)];
      this.locked = options.locked;
    },
  }
})

Transac.loadOrCreateFromOptions = function(options, cb){
  var options = fillOptions(options);
  findTransac(options, function(err, transac){
    if(err)return cb(err);
    if(!transac) insertTransac(Transac.factory(options), cb);
    else if(transac.isMulti()) addNestedTransac(options, transac, cb);
    else if(transac.isLocked()) cb({message: 'Transaction already locked', code: 'locked'});
    else insertTransac(Transac.factory(options), cb);
  });
}

Transac.addEventFromOptions = function(id, options, cb){
  async.waterfall([
    Transac.load.bind(null, id),
    function(transac, cb){
      if(!transac)return setImmediate(cb, {message: "Unknown transaction", code: 'notransac'});
      var event = new Event(options);
      transac.addEvent(event, cb);
    }
  ], cb); 
}

Transac.load = function(id, cb){
  Transac.findOne({_id: id},  function(err, transac){
    if(err)return cb(err);
    cb(null, transac);
  });
}

Transac.options = ['name', 'valueDate', 'server', 'processId', 'user', 'locked', 'nested'];

function insertTransac(transac, cb){
  Transac.collection.insert(transac, function(err, transacs){
    cb(err, transacs[0]);
  });
}

function addNestedTransac(options, transac, cb){
  var nestedTransac = new ElementaryTransac(options);
  transac.addNestedTransac(nestedTransac)
  Transac.collection.update({_id: transac._id}, { $push: {nestedTransacs: nestedTransac}}, function(err){
    cb(err, transac);
  });
}



function findTransac(options, cb){
  Transac.findAll({name: options.name, valueDate: options.valueDate}, {sort: {processingTime: -1}},  function(err, transacs){
    if(err)return cb(err);
    cb(null, transacs[0]);
  });
}

function fillOptions(options){
  return _.extend({valueDate: moment().startOf('day').toDate()}, _.pick.bind(_, options).apply(_, Transac.options));
}



