var TransacProto = {
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
}

var Transac = function(){
}

Transac.bless = function(obj){
  obj.__proto__ = TransacProto;
  return obj;
}

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

var transacCtrl = angular.module('transacCtrl', []);

transacCtrl.factory('transacContext', function(){
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
        var key = this.dateMode == 'Value Date' ? 'Value' : 'Processing';
        return 'Start ' + key + ' Date';
      },
      get endDateName(){
        var key = this.dateMode == 'Value Date' ? 'Value' : 'Processing';
        return 'End ' + key + ' Date';
      },
    }
  };
});

transacCtrl.controller('TransacListCtrl', ['transacContext', '$scope', '$http', '$filter',  function(ctx, $scope, $http, $filter){

  function loadTransacs(){
    var startDate = $filter('date')($scope.params.startDate, "yyyy/MM/dd");
    var endDate = $filter('date')($scope.params.endDate, "yyyy/MM/dd");
    var mode = $scope.params.dateMode == 'Value Date' ? 'v' : 'p';
    $http.get("transacs?mode=" + mode +"&startDate=" + startDate + "&endDate=" + endDate).success(function(data){
      $scope.transacs = _.map(data, function(t){ return Transac.bless( t ) });;
    });
  }

  $scope.params = ctx.params;

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

  headerAffix();
 loadTransacs();
}]);


transacCtrl.controller('TransacDetailCtrl', ['transacContext', '$filter', '$scope', '$http', '$routeParams', '_', '$q', '$sce',  function(transacContext, $filter, $scope, $http, $routeParams, _, $q, $sce){
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

  function loadDetail(transacId){
    var deferred = $q.defer();
    $http.get("transacs/" + transacId).success(function(data){
      deferred.resolve(data);
    });
    return deferred.promise;
  }

  function setTransac(data){
    $scope.transac = Transac.bless( data );
    $scope.events = $scope.transac.isMulti ? eventsGroupByTransac($scope.transac) : eventsGroupByDate($scope.transac);
  }

  $scope.params = {
    sort: 'processingTime',
    reverse: true,
  };

  $scope.isCurrent = function(scope, transac){
    return scope.transac.id == transac.id ? 'yes' : 'no';
  }

  function formatSelect2(transac){
    console.log(transac);
    return "TRANSAC => ";
  };

  $scope.select2Options = {
    formatResult: formatSelect2,
    formatSelection: formatSelect2,
  };

  $scope.loadDetailFromHistory = function(id){
    loadDetail(id).then(function(data){
      setTransac(data);
    })
  }

  // $scope.eventsGroupByDate = function(){
  //   return eventsGroupByDate($scope.transac);
  // }

  loadDetail($routeParams.transacId).then(function(data){
    setTransac(data);
    return $scope.transac;
  }).then(function(transac){
    $http.get("transacs?name=" + transac.name).success(function(data){
      $scope.transacs = _.map(data, function(t){ return Transac.bless( t ) });;
    });
  });

  
  $scope.htmlMessage = function(event){
    return $sce.trustAsHtml( event.message.replace(/(\n\r|\n|\r)/gm, "<br />") );
  }

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
  }

  $scope.toggleEventsView = function(elt){
    elt.isCollapsed = !elt.isCollapsed;
    _.each(elt.events, function(event){
      event.isCollapsed = elt.isCollapsed;
    });
  }

  headerAffix();
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
