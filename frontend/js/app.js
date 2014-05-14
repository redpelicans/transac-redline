'use strict';

var app = angular.module('transac', [
  'transac.services',
  'transac.directives',
  'transac.controller',
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ui.select'
]);

app.config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/transacs', {
        templateUrl: 'views/transac_list.html',
        controller: 'TransacListCtrl',
        resolve:{
          transacs: function(TransacsLoader){
            return TransacsLoader();
          }
        }

      }).
      when('/transacs/:transacId', {
        templateUrl: 'views/transac_detail.html',
        controller: 'TransacDetailCtrl',
        resolve:{
          transac: function(TransacLoader){
            return TransacLoader();
          }
        }
      }).
      otherwise({
        redirectTo: '/transacs'
      });
  }
]);



