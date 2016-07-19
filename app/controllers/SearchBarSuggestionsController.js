app.controller('SearchBarSuggestionsController', ['$scope', 'SearchService', function($scope, SearchService) {

  $scope.suggestions = [];
  $scope.lastTypedTerm = '';
  $scope.isLoading = false;
  $scope.isInitial = true;

  $scope.$watch(function() {
    return $scope.query;
  }, function() {
    if ( $scope.shouldDisplaySuggestions ) {
      $scope.isInitial = false;
      $scope.lastTypedTerm = $scope.getLastTypedTerm();
    }
  });

  $scope.$watch(function() {
    return $scope.shouldDisplaySuggestions;
  }, function() {
    if ( !$scope.shouldDisplaySuggestions ) {
      $scope.suggestions = []; // Delete suggestions on suggestions close
      $scope.isInitial = true;
    }
  });

  $scope.$watch(function() {
    return $scope.lastTypedTerm;
  }, function() {
    if ( $scope.lastTypedTerm.length > 0 && !$scope.isAcceptingSuggestion ) {
      $scope.isLoading = true;
      var suggestionsResponse = SearchService.fetchSuggestionsFor($scope.lastTypedTerm).then(function(response) {
        if ( $scope.shouldDisplaySuggestions ) {
          $scope.suggestions = response.data;
          $scope.isLoading = false;
        }
      });
    }
  });

}]);
