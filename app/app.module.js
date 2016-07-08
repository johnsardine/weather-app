var app = angular.module('weather-app', []);

app.factory('SearchService', [function() {

  var query_terms = [];
  var updateNotifications = [];

  function updateTerms(terms) {
    query_terms = terms;
    notifyDidUpdateTerms(terms);
    return true;
  }

  // Notify contexts that the terms were updated
  function didUpdateTerms(callback) {
    updateNotifications.push(callback);
  }
  function notifyDidUpdateTerms(terms) {
    for (var i = 0; i < updateNotifications.length; i++) {
      updateNotifications[i](terms);
    }
  }

  function getTerms() {
    return query_terms;
  }

  var SearchService = {
    updateTerms: updateTerms,
    getTerms: getTerms,
    didUpdateTerms: didUpdateTerms
  };

 return SearchService;
}]);

app.controller('SearchBarController', ['$scope', 'SearchService', function($scope, SearchService) {

  // Init form variable
  $scope.searchForm = null;

  $scope.query = 'Lisbon, Paris, Los Angeles'; // Default query value
  $scope.query_terms = [];

  var _splitByCharacter = ','; // Set split character

  // Extract terms from query
  function extractQueryTerms(query) {
    var splittedTerms = query.split(_splitByCharacter); // Split by comma
    var trimmedTerms = splittedTerms.map(function(value) {
      return value.trim(); // Remove any whitespace before or after extracted term
    });
    var filteredTerms = trimmedTerms.filter(function(value) {
      return value.length;
    });
    return filteredTerms;
  };

  // Build query from terms
  function builQueryFromTerms(terms) {
    return terms.join(', ');
  }

  // Watch for query changes and extract query terms
  $scope.$watch(function() {
    return $scope.query;
  }, function() {
    $scope.query_terms = extractQueryTerms($scope.query);
  });

  // Watch for query_terms changes and update service
  $scope.$watch(function() {
    return $scope.query_terms;
  }, function() {
    $scope.updateService();
  });

  // Remove term from query
  $scope.removeQueryTerm = function(term) {
    var termIndex = $scope.query_terms.indexOf(term);
    // Term does not exist, return false
    if ( termIndex < 0 ) {
      return false;
    }
    // Remove term
    $scope.query_terms.splice(termIndex, 1);
    $scope.query = builQueryFromTerms($scope.query_terms);
    return true;
  };

  // Notify service that terms were updated
  $scope.updateService = function() {
    console.log('updateService');
    SearchService.updateTerms($scope.query_terms);
  };

  // Detect certain special keys and handle accordingly
  $scope.didKeyUp = function(e) {

    // Pressed Return
    if (e.keyCode == 13) {
      e.target.blur();
    }

    // Pressed ESC
    if (e.keyCode == 27) {
      $scope.searchForm.searchQuery.$rollbackViewValue();
      e.target.blur();
    }
  };

  // Visibility conditions
  $scope.shouldDisplayQuery = false;
  $scope.shouldDisplayTerms = true;

  $scope.$watch(function() {
    return $scope.query_terms;
  }, function() {
    $scope.shouldDisplayQuery = $scope.query_terms.length > 0 ? false : true;
    $scope.shouldDisplayTerms = $scope.query_terms.length > 0 ? true : false;
  });

  $scope.didFocusQuery = function() {
    $scope.shouldDisplayQuery = true;
    $scope.shouldDisplayTerms = false;
  };
  $scope.didBlurQuery = function() {
    $scope.shouldDisplayQuery = false;
    $scope.shouldDisplayTerms = true;
  };
}]);

app.controller('SearchBarTermsController', ['$scope', 'SearchService', function($scope, SearchService) {

  $scope.terms = [];

  // Recieve terms updates
  SearchService.didUpdateTerms(function(terms) {
    $scope.terms = terms;
  });

}]);

app.controller('SearchBarSuggestionsController', ['$scope', function($scope) {
}]);

app.controller('SearchResultsController', ['$scope', 'SearchService', function($scope, SearchService) {

  $scope.terms = [];

  // Recieve terms updates
  SearchService.didUpdateTerms(function(terms) {
    $scope.terms = terms;
  });

}]);
