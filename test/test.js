/* jshint node: true */
'use strict';

var transac = require('../')
  , should = require('should')
  , assert = require('assert')
  , mongoRedline = require('mongo-redline');

function runTests(){
  describe('Events', function(){
    it('should create an event', function(){});
  });
}


describe('Database Connexion', function(){
  it('should connect to mongo', function(done){
    mongoRedline.connect({host: 'localhost', database: 'tests'}, function(err){
      should.not.exist(err);
      done();
      runTests();
    });
  });
});
