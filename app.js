'use strict';

var Transac = require('./transac')
    , express = require('express')
    , async = require('async')
    , moment = require('moment')
    , redMongo = require('mongo-redline')
    , _ = require('underscore');

module.exports.start = function(cb){
  var app = express();

  app.post('/transacs', createTransac);
  app.put('/transacs/:id/events', createEvent);
  app.get('/transacs/:id', loadTransac);
  app.get('/transacs', loadTransacs);
  
  cb(null, app);

  function loadTransacs(req, res, next){
    var dateMode = req.query.mode == 'value' ? 'valueDate' : 'processingTime'
      , d1 = req.query.startDate && moment(req.query.startDate, 'YYYY/MM/DD').startOf('day').toDate() || moment().startOf('day').toDate()
      , d2 = req.query.endDate && moment(req.query.endDate, 'YYYY/MM/DD').endOf('day').toDate() || moment().endOf('day').toDate()
      , query = {};

      query[dateMode] = {$gte: d1, $lte: d2};

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


