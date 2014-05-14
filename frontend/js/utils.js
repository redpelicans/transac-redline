'use strict';


var utils = angular.module('transac.utils', []);
//var underscore = angular.module('underscore', []);
//underscore.factory('_', function(){
utils.factory('_', function(){
  return window._; // assumes underscore has already been loaded on the page
});

utils.factory('utils', function(){
  return lib;
});

var lib = {
  extend: function (destination, source) {
    var sources = Array.prototype.slice.call(arguments, 1);
    for(var i in sources){
      var src = sources[i];
      Object.keys(src).forEach(function(property) {
        Object.defineProperty(destination, property, Object.getOwnPropertyDescriptor(src, property));
      });
    }
    return destination;
  }
}





