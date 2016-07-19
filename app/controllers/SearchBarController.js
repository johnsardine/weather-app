app.controller('SearchBarController', ['$scope', '$timeout', 'SearchService', function($scope, $timeout, SearchService) {

  // Init form variable
  $scope.searchForm = null;

  var storedQueryVariable = localStorage.getItem('query');
  $scope.query = (storedQueryVariable) ? storedQueryVariable : 'Lisbon, Paris, Los Angeles'; // Default query value
  $scope.temporaryQuery = $scope.query;
  $scope.queryTerms = [];

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
  }

  // Build query from terms
  function builQueryFromTerms(terms) {
    var queryString = terms.join(', ');
    return queryString.length ? queryString + ', ' : queryString;
  }

  // Watch for query changes and extract query terms
  /*$scope.$watch(function() {
    return $scope.query;
  }, function() {
    $scope.queryTerms = extractQueryTerms($scope.query);
  });*/

  $scope.loadResutsFromQuery = function() {
    $scope.queryTerms = extractQueryTerms($scope.query);
  };

  // Run once from stored default query
  $scope.loadResutsFromQuery(); // Not sure about this way of triggering a first load

  // Watch for queryTerms changes and update service
  $scope.$watch(function() {
    return $scope.queryTerms;
  }, function() {
    $scope.updateQueryString();
    $scope.updateService();
  });

  // Remove term from query
  $scope.removeQueryTerm = function(term) {
    var termIndex = $scope.queryTerms.indexOf(term);
    // Term does not exist, return false
    if ( termIndex < 0 ) {
      return false;
    }
    // Remove term
    $scope.queryTerms.splice(termIndex, 1);
    $scope.query = builQueryFromTerms($scope.queryTerms);
    $scope.didChangeQueryText();
    return true;
  };

  // Notify service that terms were updated
  $scope.updateService = function() {
    SearchService.updateTerms($scope.queryTerms);
  };

  $scope.updateQueryString = function() {
    var originalQuery = $scope.query;
    if ( originalQuery.length > 0 && !originalQuery.endsWith(', ') ) {
      $scope.query = originalQuery + ', ';
    }
  };

  $scope.didChangeQueryText = function() {
    $scope.loadResutsFromQuery();
    $scope.temporaryQuery = $scope.query;
    localStorage.setItem('query', $scope.query);
  };

  $scope.getLastTypedTerm = function() {
    var terms = extractQueryTerms($scope.query);
    return ( typeof terms[terms.length - 1] === 'string' ) ? terms[terms.length - 1] : '';
  };

  $scope.isAcceptingSuggestion = false;
  $scope.acceptSuggestion = function(term) {
    $scope.isAcceptingSuggestion = true;
    var lastTypedTerm = $scope.getLastTypedTerm();
    var query = $scope.query;
    var queryTerms = extractQueryTerms($scope.query);
    queryTerms[queryTerms.length - 1] = term;
    $scope.query = builQueryFromTerms(queryTerms);
  };

  // Detect certain special keys and handle accordingly
  $scope.didKeyUp = function(e) {

    // Pressed Return
    if (e.keyCode == 13) {
      e.target.blur();
    }

    // Pressed ESC
    if (e.keyCode == 27) {
      // Deprecated after suggestions were introduced
      //$scope.searchForm.searchQuery.$rollbackViewValue();
      $scope.query = $scope.temporaryQuery;
      e.target.blur();
    }
  };

  // Visibility conditions - watch runs on init, sets correct visibility
  $scope.shouldDisplaySuggestions = false;
  $scope.$watch(function() {
    return $scope.queryTerms;
  }, function() {
    $scope.shouldDisplayQuery = false || !$scope.queryTerms.length;
    $scope.shouldDisplayTerms = true && $scope.queryTerms.length;
  });

  $scope.didFocusQuery = function() {
    $scope.shouldDisplayQuery = true;
    $scope.shouldDisplayTerms = false;
    $scope.shouldDisplaySuggestions = true;
  };
  $scope.didBlurQuery = function(e) {
    $timeout(function() {
      $scope.shouldDisplayQuery = false || !$scope.queryTerms.length;
      $scope.shouldDisplayTerms = true && $scope.queryTerms.length;
      $scope.shouldDisplaySuggestions = false;
      $scope.didChangeQueryText();
      $scope.isAcceptingSuggestion = false;
    }, 250);
  };

  // Edit clicked term
  $scope.didClickTerm = function(term) {
    SearchService.notifyDidTapTermToEdit(term);
  };
}]);
