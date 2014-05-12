'use strict';

var transacApp = angular.module('transacRedlineApp', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ui.select',
  'transacRedlineMainCtrl',
  'underscore'
]);

transacApp.config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/transacs', {
        templateUrl: 'views/transac_list.html',
        controller: 'TransacListCtrl'
      }).
      when('/transacs/:transacId', {
        templateUrl: 'views/transac_detail.html',
        controller: 'TransacDetailCtrl'
      }).
      otherwise({
        redirectTo: '/transacs'
      });
  }
]);

transacApp.controller('MainCtrl', ['$scope', function($scope){
  $scope.message = 'COUCOU';
}]);

var underscore = angular.module('underscore', []);
underscore.factory('_', function(){
  return window._; // assumes underscore has already been loaded on the page
});
