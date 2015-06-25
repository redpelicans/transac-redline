'use strict';
var redMongo = require('mongobless'),
    ObjectID = redMongo.ObjectID,
    moment = require('moment'),
    async = require('async'),
    _ = require('lodash');

var Event = function Event(options) {
  this.time = new Date();
  this.type = options.type;
  this.label = options.label;
  this.message = options.message;
};

Event.prototype = {
  toJSON: function toJSON() {
    return {
      label: this.label,
      time: +this.time,
      type: this.type,
      message: this.message
    };
  }
};

var ElementaryTransac = function ElementaryTransac(options) {
  this.processingTime = new Date();
  if (options.server) this.server = options.server;
  if (options.user) this.user = options.user;
  if (options.processId) this.processId = options.processId;
  this.events = [];
  this.status = 'ok';
};

var ElementaryTransacProto = Object.defineProperties({

  toJSON: function toJSON() {
    return {
      processingTime: +this.processingTime,
      status: this.status,
      isRunning: this.isRunning(),
      server: this.server,
      user: this.user,
      processId: this.processId,
      delay: this.delay,
      events: _.map(this.events, function (event) {
        return event.toJSON();
      })
    };
  },

  hasEventTypes: function hasEventTypes(types) {
    return _.some(this.events, function (event) {
      return _.contains(types, event.type);
    });
  },

  isRunning: function isRunning() {
    return !this.hasEventTypes(['abort', 'commit']);
  },

  computeStatus: function computeStatus(event) {
    switch (event.type) {
      case 'error':
      case 'abort':
        this.status = 'error';
        break;
      case 'warning':
        if (this.status == 'ok') this.status = 'warning';
    }
    return this.status;
  }
}, {
  lastEvent: {

    // get status(){
    //   if(!this.lastEvent) return 'ok';
    //   if(this.hasEventTypes(['error'])) return 'error';
    //   if(this.hasEventTypes(['warning'])) return 'warning';
    //   return 'ok';
    // },

    get: function () {
      return this.events[this.events.length - 1];
    },
    configurable: true,
    enumerable: true
  },
  lastEventTime: {
    get: function () {
      return this.lastEvent && this.lastEvent.time;
    },
    configurable: true,
    enumerable: true
  },
  delay: {
    get: function () {
      if (this.lastEvent) return this.lastEvent.time - this.processingTime;else return 0;
    },
    configurable: true,
    enumerable: true
  }
});

ElementaryTransac.prototype = ElementaryTransacProto;

var Transac = redMongo.defineModel({
  collection: 'transacs',
  instanceMethods: {
    isLocked: function isLocked() {
      return this.locked;
    },

    isMulti: function isMulti() {
      return this.type == 'multi';
    },

    toSummaryJSON: function toSummaryJSON() {
      return {
        id: this._id,
        name: this.name,
        valueDate: +this.valueDate,
        processingTime: +this.processingTime,
        lastEventTime: +this.lastEventTime,
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isMulti: this.isMulti(),
        server: this.server,
        delay: this.delay
      };
    }
  }
});

module.exports = Transac;

Transac.factory = function (options) {
  return options.nested ? new MultiTransac(options) : new PlainTransac(options);
};

Transac.bless = function (transac) {
  switch (transac.type) {
    case 'plain':
      var obj = redMongo.Model.bless.bind(PlainTransac)(transac);
      _.each(obj.events, function (event) {
        event.__proto__ = Event.prototype;
      });
      return obj;
    case 'multi':
      var obj = redMongo.Model.bless.bind(MultiTransac)(transac);
      _.each(obj.nestedTransacs, function (nt) {
        nt.__proto__ = ElementaryTransacProto;
        _.each(nt.events, function (event) {
          event.__proto__ = Event.prototype;
        });
      });
      return obj;
  }
};

var PlainTransac = redMongo.defineModel({

  'extends': Transac,

  mixins: [ElementaryTransacProto],

  instanceMethods: {

    toJSON: function toJSON() {
      return {
        id: this._id,
        name: this.name,
        valueDate: +this.valueDate,
        processingTime: +this.processingTime,
        lastEventTime: +this.lastEventTime,
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isMulti: this.isMulti(),
        server: this.server,
        user: this.user,
        processId: this.processId,
        delay: this.delay,
        events: _.map(this.events, function (event) {
          return event.toJSON();
        })
      };
    },

    addEvent: function addEvent(event, cb) {
      var transac = this;
      if (!transac.isRunning()) return setImmediate(cb, { message: 'Can\'t add an event on a non running transac', code: 'closed' });
      Transac.collection.update({ _id: transac._id }, { $set: { status: transac.computeStatus(event) }, $push: { events: event } }, function (err) {
        if (err) return cb(err);
        transac.events.push(event);
        cb(null, event, transac);
      });
    } },

  staticMethods: {
    init: function init(options) {
      var options = fillOptions(options);
      this.type = 'plain';
      this.name = options.name;
      this.valueDate = options.valueDate;
      this.processingTime = new Date();
      if (options.server) this.server = options.server;
      if (options.user) this.user = options.user;
      if (options.processId) this.processId = options.processId;
      this.events = [];
      this.locked = options.locked;
      this.status = 'ok';
    }
  }
});

var MultiTransac = redMongo.defineModel({
  'extends': Transac,

  instanceMethods: Object.defineProperties({

    toJSON: function toJSON() {
      return {
        id: this._id,
        name: this.name,
        valueDate: +this.valueDate,
        processingTime: +this.processingTime,
        lastEventTime: +this.lastEventTime,
        locked: this.isLocked(),
        status: this.status,
        isRunning: this.isRunning(),
        isMulti: this.isMulti(),
        server: this.server,
        delay: this.delay,
        nested: _.map(this.nestedTransacs, function (nt) {
          return nt.toJSON();
        }) };
    },

    addEvent: function addEvent(event, cb) {
      var transac = this;
      if (!transac.isRunning()) return setImmediate(cb, { message: 'Can\'t add an event on a non running transac', code: 'closed' });
      var count = transac.nestedTransacs.length - 1,
          newStatus = transac.lastElementaryTransac.computeStatus(event),
          statusField = 'nestedTransacs.' + count + '.status',
          eventField = 'nestedTransacs.' + count + '.events',
          statusQuery = {},
          eventQuery = {};

      statusQuery[statusField] = newStatus;
      eventQuery[eventField] = event;

      Transac.collection.update({ _id: transac._id }, { $set: statusQuery, $push: eventQuery }, function (err) {
        if (err) return cb(err);
        transac.lastElementaryTransac.events.push(event);
        cb(null, event, transac);
      });
    },

    addNestedTransac: function addNestedTransac(transac) {
      this.nestedTransacs.push(transac);
    },

    isRunning: function isRunning() {
      return this.lastElementaryTransac.isRunning();
    } }, {
    lastElementaryTransac: {
      get: function () {
        return this.nestedTransacs[this.nestedTransacs.length - 1];
      },
      configurable: true,
      enumerable: true
    },
    lastEvent: {
      get: function () {
        return this.lastElementaryTransac.lastEvent;
      },
      configurable: true,
      enumerable: true
    },
    lastEventTime: {
      get: function () {
        return this.lastElementaryTransac.lastEventTime;
      },
      configurable: true,
      enumerable: true
    },
    status: {
      get: function () {
        if (_.some(this.nestedTransacs, function (transac) {
          return transac.status == 'error';
        })) return 'error';
        if (_.some(this.nestedTransacs, function (transac) {
          return transac.status == 'warning';
        })) return 'warning';
        return 'ok';
      },
      configurable: true,
      enumerable: true
    },
    delay: {
      get: function () {
        return _.inject(this.nestedTransacs, function (sum, transac) {
          return sum + transac.delay;
        }, 0);
      },
      configurable: true,
      enumerable: true
    },
    server: {
      get: function () {
        return this.lastElementaryTransac.server;
      },
      configurable: true,
      enumerable: true
    },
    user: {
      get: function () {
        return this.lastElementaryTransac.user;
      },
      configurable: true,
      enumerable: true
    },
    processId: {
      get: function () {
        return this.lastElementaryTransac.processId;
      },
      configurable: true,
      enumerable: true
    }
  }),

  staticMethods: {
    init: function init(options) {
      this.type = 'multi';
      this.name = options.name;
      this.valueDate = options.valueDate;
      this.processingTime = new Date();
      this.nestedTransacs = [new ElementaryTransac(options)];
      this.locked = options.locked;
    } }
});

Transac.loadOrCreateFromOptions = function (options, cb) {
  var options = fillOptions(options);
  findTransac(options, function (err, transac) {
    if (err) return cb(err);
    if (!transac) insertTransac(Transac.factory(options), cb);else if (transac.isMulti()) addNestedTransac(options, transac, cb);else if (transac.isLocked()) cb({ message: 'Transaction already locked', code: 'locked' });else insertTransac(Transac.factory(options), cb);
  });
};

Transac.addEventFromOptions = function (id, options, cb) {
  async.waterfall([Transac.load.bind(null, id), function (transac, cb) {
    if (!transac) return setImmediate(cb, { message: 'Unknown transaction', code: 'notransac' });
    var event = new Event(options);
    transac.addEvent(event, cb);
  }], cb);
};

Transac.load = function (id, cb) {
  Transac.findOne({ _id: id }, function (err, transac) {
    if (err) return cb(err);
    cb(null, transac);
  });
};

Transac.options = ['name', 'valueDate', 'server', 'processId', 'user', 'locked', 'nested'];

function insertTransac(transac, cb) {
  Transac.collection.insert(transac, function (err, transacs) {
    if (err) return cb(err);
    cb(null, transacs[0]);
  });
}

function addNestedTransac(options, transac, cb) {
  var nestedTransac = new ElementaryTransac(options);
  transac.addNestedTransac(nestedTransac);
  Transac.collection.update({ _id: transac._id }, { $push: { nestedTransacs: nestedTransac } }, function (err) {
    cb(err, transac);
  });
}

function findTransac(options, cb) {
  Transac.findAll({ name: options.name, valueDate: options.valueDate }, { sort: { processingTime: -1 } }, function (err, transacs) {
    if (err) return cb(err);
    cb(null, transacs[0]);
  });
}

function fillOptions(options) {
  return _.extend({ valueDate: moment().startOf('day').toDate() }, _.pick.bind(_, options).apply(_, Transac.options));
}
//# sourceMappingURL=transac.js.map