'use strict';

var Transac = require('./transac')
    , express = require('express')
    , bodyParser = require('body-parser')
    , async = require('async')
    , moment = require('moment')
    , redMongo = require('mongo-redline')
    , _ = require('underscore');

module.exports.start = function(cb){
  var app = express();

  app.use(bodyParser());
  app.put('/transacs/:id/events', createEvent);
  app.get('/transacs/ping', ping);
  app.get('/transacs/:id', loadTransac);
  app.get('/transacs', loadTransacs);
  app.post('/transacs', createTransac);
  
  cb(null, app);


  function ping(req, res, next){
    res.json();
  }

  function loadTransacs(req, res, next){
    var dateMode = req.query.mode == 'v' ? 'valueDate' : 'processingTime'
      , d1 = req.query.startDate && moment(req.query.startDate, 'YYYY/MM/DD').startOf('day').toDate()
      , d2 = req.query.endDate && moment(req.query.endDate, 'YYYY/MM/DD').endOf('day').toDate()
      , name = req.query.name
      , query = {};

      if(d1 && d2)query[dateMode] = {$gte: d1, $lte: d2};
      if(name)query['name'] = name;

    Transac.findAll(query, function(err, transacs){
      if(err) res.status(500).json(err);
      res.json(_.map(transacs, function(transac){return transac.toSummaryJSON()}));
    });

  }

  function loadTransac(req, res, next){
    var transacId = redMongo.ObjectID(req.params.id)
    Transac.load(transacId, function(err, transac){
      if(err) return res.status(500).json(err);
      if(!transac) return res.status(418).json({message: "Unknown transac", code: 'notransac'});
      res.json(transac.toJSON());
    })
  }

  function createTransac(req, res, next){
    var options = _.pick.bind(_, req.body).apply(_, Transac.options);
    if('valueDate' in options) options.valueDate = moment(options.valueDate, 'YYYY/MM/DD').toDate();

    if('locked' in options) options.locked = options.locked === 'true';
    if('nested' in options) options.nested = options.nested === 'true';
    
    Transac.loadOrCreateFromOptions(options, function(err, transac){
      if(err) {
        if(err.code) res.status(418).json(err);
        else res.status(500).json(err);
      }else res.json(transac.toSummaryJSON());
    });
  }


  function createEvent(req, res, next){
    var transacId = redMongo.ObjectID(req.params.id)
      , options = _.pick(req.body, 'type', 'label', 'message');

    Transac.addEventFromOptions(transacId, options, function(err, event){
      if(err){
        if(err.code) res.status(418).json(err);
        else res.status(500).json(err);
      }else res.json(event.toJSON());
    });
  }
}


