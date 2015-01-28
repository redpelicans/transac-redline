/* jshint node: true */
'use strict';

var mongoRedline = require('mongodb').MongoClient
  , _ = require('lodash')



mongoRedline.connect('mongodb://127.0.0.1/test', function(err, db){
  var piece = {
    get f(){return 1},
    __proto__:{
      get g(){
        return '1';
      }
    }
  };
  db.collection('test').insert(piece, function(err, data){
    console.log(err);
    console.log(data);
    db.close();
  });
});






