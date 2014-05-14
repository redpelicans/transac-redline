'use strict';

var app = angular.module('transac.controller', [
  'transac.services',
  'transac.directives',
  'transac.utils',
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ui.select',
]);

app.controller('MainCtrl', ['$scope', '$interval', '$http', function($scope, $interval, $http ){
  function pingServer(){
    $http.get('/transacs/ping').success(function(){
      $scope.alert.on = false;
      $interval(pingServer, 5000, 1);
    }).error(function(){
      $scope.alert.message = 'Server is unreachable !!!';
      $scope.alert.on = true;
      $scope.alert.class = 'alert-danger';
      $interval(pingServer, 5000, 1);
    });
  }

  $scope.alert = {};
  $scope.alert.message = 'Checking server connexion ...';
  $scope.alert.on = true;
  $scope.alert.class = 'alert-info';
  $interval(pingServer, 1000, 1);

}]);


function headerAffix() {
  var $transacHeader = $('.transac-header')
    , $affixedContainer = $transacHeader.find('.affixed-container')
    , $container = $transacHeader.find('.container');
  
  $transacHeader.affix({
    offset: {
      top: $('.navbar').outerHeight()
    }
  }).on('affix.bs.affix', function() {
    $transacHeader.addClass('no-background');
    $container.hide();
    
    //need to be called in next tick
    setTimeout(function() {
      $transacHeader.addClass('affix-done');
      $affixedContainer.show();
    }, 0);
  }).on('affix-top.bs.affix', function() {
    $transacHeader.removeClass('no-background');
    $transacHeader.removeClass('affix-done');
    
    $container.show();
    $affixedContainer.hide();
  });
}



app.controller('TransacListCtrl', ['TransacContext', '$scope', '$http', 'TransacsLoader', 'transacs',   function(ctx, $scope, $http, TransacsLoader, transacs){

  function loadTransacs(){
    TransacsLoader().then(function(transacs){ $scope.transacs = transacs; });
  }

  $scope.startDateOpen = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.startDateOpened = true;
  };

  $scope.endDateOpen = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.endDateOpened = true;
  };

  $scope.formHasChanged = function() {
    loadTransacs();
  }

  $scope.dateModeHasChanged = function() {
    loadTransacs();
  }

  $scope.params = ctx.params;
  headerAffix();
  $scope.transacs = transacs;
}]);


app.controller('TransacDetailCtrl', ['$filter', '$scope',  '_', '$q', '$sce', 'TransacLoader', 'TransacHistoryLoader', 'transac',  function( $filter, $scope, _, $q, $sce, TransacLoader, TransacHistoryLoader, transac){

  function ymd(date){
    return $filter('date')(date, "yyyy/MM/dd");
  }

  function ymdhms(date){
    return $filter('date')(date, "yyyy/MM/dd HH:mm:ss");
  }

  function eventsGroupByDate(transac){
    var res = {};
    res[ymd(transac.processingTime)] = { events: [{ type: 'begin', isCollapsed: false, time: transac.processingTime, message: firstMessage(transac) }] };
    _.each(transac.events, function(event){
      var key = ymd(event.time);
      if(!res[key]) res[key] = { events:[] };
      event.isCollapsed = false;
      res[key].events.push( event );
    });
    return _.map(res, function(value, key){return {date: key, isCollapsed: false, events: value.events, get panelClass(){ return transac.panelClass} }});
  }

  function eventsGroupByTransac(transac){
    var res = [];
    _.each(transac.nested, function(subTransac){
      var key = ymdhms(subTransac.processingTime)
        , nt = {};
      nt = { date: key, isCollapsed: false, get panelClass(){return panelClass(subTransac.status)}, events: [{ isCollapsed: false, type: 'begin', time: subTransac.processingTime, message: firstMessage(subTransac) }] };
      res.push(nt);
      _.each(subTransac.events, function(event){ event.isCollapsed = false; nt.events.push( event ) });
    });
    return res;
  }

  function firstMessage(transac){
    var res = [];
    if(transac.server)res.push("server: " + transac.server);
    if(transac.processId)res.push("process: " + transac.processId);
    if(transac.user)res.push("user: " + transac.user);
    if(transac.locked)res.push("locked: true");

    return res.join(', ');
  }

  function setEvents(){
    $scope.events = $scope.transac.isMulti ? eventsGroupByTransac($scope.transac) : eventsGroupByDate($scope.transac);
  }

  $scope.params = {
    sort: 'processingTime',
    reverse: true,
  };

  $scope.isCurrent = function(scope, transac){
    return scope.transac.id === transac.id ? 'yes' : 'no';
  }

  function formatSelect2(transac){
    console.log(transac);
    return "TRANSAC => ";
  }

  $scope.select2Options = {
    formatResult: formatSelect2,
    formatSelection: formatSelect2,
  };

  $scope.loadDetailFromHistory = function(id){
    TransacLoader(id).then(function(transac){
      $scope.transac = transac;
      setEvents();
    })
  };


  $scope.transac = transac;
  setEvents();
  TransacHistoryLoader($scope.transac.name).then(function(transacs){
    $scope.transacs = transacs;
  });



  $scope.htmlMessage = function(event){
    return $sce.trustAsHtml( event.message.replace(/(\n\r|\n|\r)/gm, "<br />") );
  };

  $scope.eventClass = function(event){
    switch(event.type){
      case 'begin':
      case 'info':
      case 'commit':
      case 'error':
      case 'abort':
      case 'warning':
        return "event event_" + event.type;
    }
  };

  $scope.toggleEventsView = function(elt){
    elt.isCollapsed = !elt.isCollapsed;
    _.each(elt.events, function(event){
      event.isCollapsed = elt.isCollapsed;
    });
  };

  headerAffix();
}]);


