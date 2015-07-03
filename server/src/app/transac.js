import {Transac} from '../models';
import {TransacError} from '../helpers';
import {dmy, FMT} from '../helpers';
import * as transacs from '../helpers/transac';
import express from 'express';
import async from 'async';
import moment from 'moment';
import _ from 'lodash';

export function init(mainApp, resources){
  let app = express();

  app.get('/transacs', loadTransacs);
  app.get('/transacs/:id', loadTransac);
  app.post('/transacs', createTransac);
  app.put('/transacs/:id/events', createEvent);

  function loadTransacs(req, res, next){
    let options = {
        label: req.query.label
      , from: req.query.from && moment(req.query.from, FMT).startOf('day').toDate()
      , to: req.query.to && moment(req.query.to, FMT).startOf('day').toDate()
      , dateMode: req.query.mode == 'v' ? 'valueDate' : 'createdAt'
    }

    transacs.loadAll(resources.conn, options, (err, transacs) => {
      if(err) return next(err);
      res.json(_.map(transacs, transac=>transac.toSummaryJSON()));
    });

  }

  function loadTransac(req, res, next){
    var transacId = req.params.id;
    transacs.load(resources.conn, transacId, function(err, transac){
      if(err) return next(err);
      if(!transac) return new Error("Unknown transac");
      res.json(transac.toJSON());
    })
  }


  function createTransac(req, res, next){
    let options = req.body;
    if('valueDate' in options) options.valueDate = moment(options.valueDate, FMT).toDate();
    if('locked' in options) options.locked = options.locked === 'true';
    if('compound' in options) options.compound = options.compound === 'true';
    if('processId' in options) options.processId = +options.processId;

    
    transacs.loadOrCreate(resources.conn, options, (err, transac) => {
      if(err) return next(err);
      res.json(transac.toSummaryJSON());
    });
  }

  function createEvent(req, res, next){
    var transacId = req.params.id
      , options = _.pick(req.body, 'level', 'label', 'messages');

    transacs.addEvent(resources.conn, transacId, options, function(err, transac){
      if(err){
        if(err instanceof TransacError) res.status(418).json(err);
        else next(err);
      }else res.status(200).end();
    });
  }

  return app;
}
