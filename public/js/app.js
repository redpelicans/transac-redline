var transacApp = angular.module('transac', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'transacCtrl',
  'ui.bootstrap',
  'ui.select',
  'underscore'
]);

transacApp.config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/transacs', {
        templateUrl: 'partials/transac_list.html',
        controller: 'TransacListCtrl'
      }).
      when('/transacs/:transacId', {
        templateUrl: 'partials/transac_detail.html',
        controller: 'TransacDetailCtrl'
      }).
      otherwise({
        redirectTo: '/transacs'
      });
  }
]);


var underscore = angular.module('underscore', []);
underscore.factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
});
