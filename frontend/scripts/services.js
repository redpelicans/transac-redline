'use strict';

function panelClass(status){
  switch(status){
    case 'ok':
      return 'panel-success';
    case 'warning':
      return 'panel-warning';
    case 'error':
      return 'panel-danger';
  }
}

var TransacProto = {
  coucou: function(){return 'coucou'},

  get statusIcon(){
    switch(this.status){
      case 'ok':
        return 'glyphicon glyphicon-chevron-down green-icon';
      case 'warning':
        return 'glyphicon glyphicon-warning-sign orange-icon';
      case 'error':
        return 'glyphicon glyphicon-minus-sign red-icon';
    }
  },
 
  get isRunningIcon(){
    return (this.isRunning ? 'glyphicon glyphicon-time green-icon' : 'glyphicon glyphicon-remove orange-icon');
  },

  get isMultiIcon(){
    if(this.isMulti) return 'glyphicon glyphicon-th-large blue-icon';
  },

  get isLockIcon(){
    if(this.locked) return 'glyphicon glyphicon-lock gray-icon';
  },

  get panelClass(){
    return panelClass(this.status);
  }
};

var services = angular.module('transac.services', ['transac.utils', 'ngResource']);

services.factory('TransacContext', function(){
  var modes = ['Value Date', 'Processing Date']
    , today = new Date();

  return {
    params: {
      sort: 'processingTime',
      reverse: true,
      dateModes: modes,
      dateMode: modes[1],
      startDate: today,
      endDate: today,
      get startDateName(){
        var key = this.dateMode === 'Value Date' ? 'Value' : 'Processing';
        return 'Start ' + key + ' Date';
      },
      get endDateName(){
        var key = this.dateMode === 'Value Date' ? 'Value' : 'Processing';
        return 'End ' + key + ' Date';
      },
    }
  };
});

services.factory('Transac', ['$resource', 'utils',  function($resource, utils){
  var Transac = $resource( '/transacs/:id', {id: '@id'} );
  utils.extend(Transac.prototype, TransacProto);
  return Transac;
}]);


services.factory('TransacLoader', ['Transac', '$route', '$q', function(Transac, $route, $q ){
  return function(id){
    var deferred = $q.defer();
    Transac.get({id: id || $route.current.params.transacId},
      function(transac){ deferred.resolve(transac) },
      function(){ deferred.reject('Unable to load transac ' + (id || $route.current.params.transacId)) }
    );
    return deferred.promise;
  }
}]);


services.factory('TransacsLoader', ['Transac', 'TransacContext', '$q', '$filter', function(Transac, ctx, $q, $filter){
  return function(){
    var deferred = $q.defer()
      , startDate = $filter('date')(ctx.params.startDate, "yyyy/MM/dd")
      , endDate = $filter('date')(ctx.params.endDate, "yyyy/MM/dd")
      , mode = ctx.params.dateMode === 'Value Date' ? 'v' : 'p';

    Transac.query({mode: mode, startDate: startDate, endDate: endDate},
      function(transacs){ deferred.resolve(transacs) },
      function(){ deferred.reject('Unable to load transacs') }
    );
    return deferred.promise;
  }
}]);


services.factory('TransacHistoryLoader', ['Transac', '$route', '$q', function(Transac, $route, $q){
  return function(name){
    var deferred = $q.defer();
    Transac.query({name: name},
      function(transacs){ deferred.resolve(transacs) },
      function(){ deferred.reject("Unable to load transac history '" + name + "'") }
    );
    return deferred.promise;
  }
}]);

