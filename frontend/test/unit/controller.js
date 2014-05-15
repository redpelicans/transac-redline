'use strict';

describe('Controllers', function(){
  var $scope, ctrl;
  beforeEach(module('transac.controller'));
  beforeEach(function(){
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  describe('TransacListCtrl', function(){
    var scope, controller, mockBackend, data;;
    beforeEach(inject(function(Transac, _$httpBackend_, $rootScope, $controller){
      mockBackend = _$httpBackend_;
      scope = $rootScope.$new();
      data = new Transac({x:1});
      mockBackend.whenGET(/\/transacs/).respond([data]);
      ctrl = $controller('TransacListCtrl', {$scope: scope, transacs: [data]});
    }));

    it('should be good', function(){
      expect(scope.transacs).toEqualData([data]);
    });

    it('load transacs', function(){
      scope.formHasChanged();
      expect(scope.transacs).toEqualData([data]);
    });
  });
});
