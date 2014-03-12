/* jshint node: true */
'use strict';

var Transac = require('../transac')
  , should = require('should')
  , assert = require('assert')
  , mongoRedline = require('mongo-redline')
  , database = 'tests'
  , valueDate = new Date(2014, 0, 1);


describe('Plain transac', function(){
  before(function(done){
    mongoRedline.connect({host: 'localhost', database: database, verbose: false}, function(err, db){
      should.not.exist(err);
      db.collection(Transac.collectionName).drop(function(){done()});
    });
  });

  after(function(done){
    mongoRedline.db.collection(Transac.collectionName).drop(function(){
      mongoRedline.close(); 
      done()
    });
  });

  var testTransac;
  describe('create one', function(){
    it('should be a transac in mongo', function(done){
      var newTransac = {name: 'plain one', valueDate: valueDate};
      Transac.loadOrCreateFromOptions(newTransac, function(err, transac){
        should.not.exist(err);
        transac.type.should.equal('plain');
        transac.name.should.equal(newTransac.name);
        transac.status.should.equal('ok');
        should.not.exist(transac.isLocked());
        transac.isMulti().should.equal(false);
        transac.valueDate.should.equal(valueDate);
        transac.events.should.be.empty;
        should.not.exist(transac.locked);
        should.exist(transac._id);
        testTransac = transac;
        done();
      });
    });
  });

  describe('add it a warning', function(){
    it('should be in a warning status', function(done){
      var now = new Date()
        , newEvent =  {type: 'warning', label: 'be careful!', message: "can't do it"};
      Transac.addEventFromOptions(testTransac._id, newEvent, function(err, event, transac){
        should.not.exist(err);
        event.type.should.equal(newEvent.type);
        event.label.should.equal(newEvent.label);
        event.message.should.equal(newEvent.message);

        transac.status.should.equal(newEvent.type);
        transac.isRunning().should.be.ok;
        var lastEvent = transac.lastEvent;
        lastEvent.label.should.equal(newEvent.label);

        done();
      });
    });
  });

  describe('commit it', function(){
    it('should be ended', function(done){
      var now = new Date()
        , newEvent =  {type: 'commit'};
      Transac.addEventFromOptions(testTransac._id, newEvent, function(err, event, transac){
        should.not.exist(err);
        event.type.should.equal(newEvent.type);

        transac.status.should.equal('warning');
        transac.isRunning().should.not.be.ok;

        done();
      });
    });
  });



});
