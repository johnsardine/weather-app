var app = angular.module('weather-app', []);

app.factory('SearchService', [function() {

  var queryTerms = [];

  function updateTerms(terms) {
    var newTermsAdded = getTermsDifference(queryTerms, terms); // Get new terms added
    queryTerms = terms;
    notifyDidUpdateTerms(terms, newTermsAdded);
    return true;
  }

  function getTermsDifference(originalCollection, newCollection) {
    var diff = newCollection.filter(function(value) {
      return originalCollection.indexOf(value) === -1;
    });
    return diff;
  }

  // Notify contexts that the terms were updated
  var _didUpdateTermsCallback = [];
  function didUpdateTerms(callback) {
    _didUpdateTermsCallback.push(callback);
  }
  function notifyDidUpdateTerms(terms, newTermsAdded) {
    for (var i = 0; i < _didUpdateTermsCallback.length; i++) {
      _didUpdateTermsCallback[i](terms, newTermsAdded);
    }
  }

  var _didTapTermToEditCallback = [];
  function didTapTermToEdit(callback) {
    _didTapTermToEditCallback.push(callback);
  }
  function notifyDidTapTermToEdit(term) {
    for (var i = 0; i < _didTapTermToEditCallback.length; i++) {
      _didTapTermToEditCallback[i](term);
    }
  }

  function getTerms() {
    return queryTerms;
  }

  var SearchService = {
    updateTerms: updateTerms,
    getTerms: getTerms,
    didUpdateTerms: didUpdateTerms,
    notifyDidTapTermToEdit: notifyDidTapTermToEdit,
    didTapTermToEdit: didTapTermToEdit
  };

 return SearchService;
}]);

app.controller('SearchBarController', ['$scope', 'SearchService', function($scope, SearchService) {

  // Init form variable
  $scope.searchForm = null;

  $scope.query = 'Lisbon, Paris, Los Angeles'; // Default query value
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
    return terms.join(', ');
  }

  // Watch for query changes and extract query terms
  $scope.$watch(function() {
    return $scope.query;
  }, function() {
    $scope.queryTerms = extractQueryTerms($scope.query);
  });

  // Watch for queryTerms changes and update service
  $scope.$watch(function() {
    return $scope.queryTerms;
  }, function() {
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
    return true;
  };

  // Notify service that terms were updated
  $scope.updateService = function() {
    SearchService.updateTerms($scope.queryTerms);
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

  // Visibility conditions - watch runs on init, sets correct visibility
  $scope.$watch(function() {
    return $scope.queryTerms;
  }, function() {
    $scope.shouldDisplayQuery = false || !$scope.queryTerms.length;
    $scope.shouldDisplayTerms = true && $scope.queryTerms.length;
  });

  $scope.didFocusQuery = function() {
    $scope.shouldDisplayQuery = true;
    $scope.shouldDisplayTerms = false;
  };
  $scope.didBlurQuery = function() {
    $scope.shouldDisplayQuery = false || !$scope.queryTerms.length;
    $scope.shouldDisplayTerms = true && $scope.queryTerms.length;
  };

  // Edit clicked term
  $scope.didClickTerm = function(term) {
    SearchService.notifyDidTapTermToEdit(term);
  };
}]);

app.controller('SearchBarTermsController', ['$scope', 'SearchService', function($scope, SearchService) {

  $scope.terms = [];

  // Recieve terms updates
  SearchService.didUpdateTerms(function(terms, newTermsAdded) {
    $scope.terms = terms;
  });

}]);

app.controller('SearchBarSuggestionsController', ['$scope', function($scope) {
}]);

app.controller('SearchResultsController', ['$scope', '$timeout', 'SearchService', function($scope, $timeout, SearchService) {

  $scope.terms = [];
  $scope.weatherData = [];

  var dataRowBase = {
    label: '',
    isLoading: true
  };

  // Recieve terms updates
  SearchService.didUpdateTerms(function(terms) {
    $scope.terms = terms;
  });

  // Detect terms change and fetch new data
  $scope.$watch(function() {
    return $scope.terms;
  }, function() {
    $scope.fetchWeatherData();
  });

  function copyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeObjects(obj1, obj2) {
    for (var key in obj2) {
      obj1[key] = obj2[key];
    }
    return obj1;
  }

  $scope.fetchWeatherData = function() {
    var data = [];
    var terms = $scope.terms;
    for (var i = 0; i < terms.length; i++) {
      var termName = terms[i];

      var row = mergeObjects(copyObject(dataRowBase), {
        label: termName
      });

      data.push(row);
    }
    $scope.weatherData = data;

    $timeout(function() {
      for (var i = 0; i < data.length; i++) {
        data[i].isLoading = false;
      }
    }, 1500);
  };

}]);

app.directive('searchBarQuery', ['SearchService', function(SearchService) {

  return {
    restrict: 'A',
    link: function(scope, element, attrs, controller) {

      // When a term is clicked, focus on the query and select the touched term
      SearchService.didTapTermToEdit(function(term) {
        var queryText = element.val();
        var inputDom = element[0];
        var termIndex = queryText.indexOf(term);
        var termLength = term.length;
        var selectionStart = termIndex;
        var selectionEnd = selectionStart + termLength;

        // Focus on the input
        inputDom.focus();

        // Select the tapped term
        inputDom.setSelectionRange(selectionStart, selectionEnd);

      });
    }
  };
}]);
