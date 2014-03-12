/* jshint node: true */
'use strict';

var Transac = require('../transac')
  , should = require('should')
  , assert = require('assert')
  , mongoRedline = require('mongo-redline')
  , database = 'tests'
  , valueDate = new Date(2014, 0, 1);


describe('Multi transac', function(){
  before(function(done){
    mongoRedline.connect({host: 'localhost', database: database, verbose: false}, function(err, db){
      should.not.exist(err);
      db.collection(database).drop(function(){done()});
    });
  });

  after(function(done){
    mongoRedline.db.collection(database).drop(function(){
      mongoRedline.close(); 
      done()
    });
  });

  var testTransac;
  describe('create one', function(){
    it('should be a transac in mongo', function(done){
      var newTransac = {name: 'multi one', valueDate: valueDate, nested: true};
      Transac.loadOrCreateFromOptions(newTransac, function(err, transac){
        should.not.exist(err);
        transac.name.should.equal(newTransac.name);
        transac.status.should.equal('ok');
        should.not.exist(transac.isLocked());
        transac.isMulti().should.equal(true);
        transac.valueDate.should.equal(valueDate);
        should.exist(transac._id);
        testTransac = transac;
        done();
      });
    });
  });

  describe('add it a message', function(){
    it('should be in a status ok', function(done){
      var now = new Date()
        , newEvent =  {type: 'info', label: 'loading data', message: "done it"};
      Transac.addEventFromOptions(testTransac._id, newEvent, function(err, event, transac){
        should.not.exist(err);
        event.type.should.equal(newEvent.type);
        event.label.should.equal(newEvent.label);
        event.message.should.equal(newEvent.message);

        transac.status.should.equal('ok');
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

        transac.status.should.equal('ok');
        transac.isRunning().should.not.be.ok;

        done();
      });
    });
  });

  describe('replay the same transac', function(){
    it('should be accepted because it is a multi one', function(done){
      var newTransac = {name: 'multi one', valueDate: valueDate};
      Transac.loadOrCreateFromOptions(newTransac, function(err, transac){
        should.not.exist(err);
        done();
      });
    });
  });

  describe('add it an error message', function(){
    it('should be in a status error', function(done){
      var now = new Date()
        , newEvent =  {type: 'error', label: 'loading data2', message: "done it wrong"};
      Transac.addEventFromOptions(testTransac._id, newEvent, function(err, event, transac){
        should.not.exist(err);
        event.type.should.equal(newEvent.type);
        event.label.should.equal(newEvent.label);
        event.message.should.equal(newEvent.message);

        transac.status.should.equal('error');
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

        transac.status.should.equal('error');
        transac.isRunning().should.not.be.ok;

        done();
      });
    });
  });



});
