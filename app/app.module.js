var app = angular.module('weather-app', ['ngSanitize']);

// endsWith polyfill
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

// Fetched from:  https://gist.github.com/jeffjohnson9046/9789876
app.filter('titlecase', function() {
    return function (input) {
        var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

        input = input.toLowerCase();
        return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
            if (index > 0 && index + match.length !== title.length &&
                match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
                (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                title.charAt(index - 1).search(/[^\s-]/) < 0) {
                return match.toLowerCase();
            }

            if (match.substr(1).search(/[A-Z]|\../) > -1) {
                return match;
            }

            return match.charAt(0).toUpperCase() + match.substr(1);
        });
    };
});

app.factory('SearchService', ['$http', '$q', function($http, $q) {

  var OWMAppId = '2a9faaa7ba7170d8184bf0786516667d';
  var OWMUnits = 'metric';
  var OWMWeatherEndpoint = 'http://api.openweathermap.org/data/2.5/weather?appid=' + OWMAppId + '&units=' + OWMUnits;
  var OWMNameSuggestionEndpoint = 'http://sdn.pt/github/weather-app/';

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

  function getWeatherDataByName(q) {

    var existingStoredData = getStoredWeatherDataByName(q);

    if ( typeof existingStoredData === 'object' ) {
      return $q(function(resolve, reject) {
        resolve(existingStoredData);
      });
    }

    var endpointUrl = OWMWeatherEndpoint + '&q=' + q;
    var httpPromise = $http({
      method: 'GET',
      url: endpointUrl
    });
    // Returns $q to unify the method when stored
    return $q(function(resolve, reject) {
      httpPromise.then(function(response) {
        var data = response.data;
        setStoredWeatherDataByName(q, data);
        resolve(data);
      }, reject);
    });
  }

  var _suggestionCanceler = $q.defer();
  var _suggestionRequest;
  function fetchSuggestionsFor(q) {
    var endpointUrl = OWMNameSuggestionEndpoint + '?limit=3&q=' + q;

    _suggestionCanceler.resolve();
    _suggestionCanceler = $q.defer();

    return $http({
      method: 'GET',
      url: endpointUrl,
      timeout: _suggestionCanceler.promise
    });
  }

  var _storedWeatherData = {};
  function setStoredWeatherDataByName(q, data) {
    _storedWeatherData[q] = data;
    return true;
  }
  function getStoredWeatherDataByName(q) {
    if ( typeof _storedWeatherData[q] === 'object' ) {
      return _storedWeatherData[q];
    }
    return;
  }

  var SearchService = {
    updateTerms: updateTerms,
    getTerms: getTerms,
    didUpdateTerms: didUpdateTerms,
    notifyDidTapTermToEdit: notifyDidTapTermToEdit,
    didTapTermToEdit: didTapTermToEdit,
    getWeatherDataByName: getWeatherDataByName,
    fetchSuggestionsFor: fetchSuggestionsFor
  };

 return SearchService;
}]);

app.filter('wbDate', ['$filter', function($filter) {
  return function(owmObject, forAttribute) {
    owmObject = owmObject || {};
    timestamp = owmObject.date || Date.now();
    forAttribute = forAttribute || false;

    var format;
    var formattedValue;
    if ( forAttribute ) {
      format = 'yyyy-MM-dd HH:mm:ss';
      formattedValue = $filter('date')(timestamp, format);
    } else {
      var monthName = $filter('date')(timestamp, 'LLLL');
      var day = $filter('date')(timestamp, 'd');
      var ordinalDay = function(day) {
        var suffix;
        switch (day) {
          case 1:
            suffix = 'st';
          break;
          case 2:
            suffix = 'nd';
          break;
          case 3:
            suffix = 'rd';
          break;
          default:
            suffix = 'th';
        }
        return day + suffix;
      }(parseInt(day));
      formattedValue = monthName + ' ' + ordinalDay;
    }
    return formattedValue;
  };
}]);

app.filter('wbTemperature', ['$interpolate', function($interpolate) {
  return function(owmObject) {
    owmObject = owmObject || {};

    var unit = '°C'; // Could be dynamic, but the response does not have such indicator. Could be improved
    var temperature;
    // Make sure object is set correctly and temperature exists
    if ( typeof owmObject.main === 'undefined' ) {
      temperature = 0;
    } else {
      temperature = Math.round(owmObject.main.temp);
    }

    return $interpolate('<span>{{temperature}}<sup>{{unit}}</sup></span>')({ temperature: temperature, unit: unit });
  };
}]);

app.filter('wbName', ['$interpolate', function($interpolate) {
  return function(owmObject) {
    owmObject = owmObject || {};

    var name = '&nbsp;';
    // Make sure object is set correctly and temperature exists
    if ( typeof owmObject.name === 'string' ) {
      name = $interpolate('<span title="{{name}}">{{name}}</span>')({ name: owmObject.name });
    }

    return name;
  };
}]);

app.filter('wbDescription', ['$filter', '$interpolate', function($filter, $interpolate) {
  return function(owmObject) {
    owmObject = owmObject || {};

    var description = '&nbsp;';
    // Make sure object is set correctly and temperature exists
    if ( typeof owmObject.weather === 'object' ) {
      var firstWeatherCondition = owmObject.weather[0];
      var rawDescription = $filter('titlecase')(firstWeatherCondition.description);
      description = $interpolate('<span title="{{description}}">{{description}}</span>')({ description: rawDescription });
    }

    return description;
  };
}]);

app.filter('wbHumidity', ['$filter', function($filter) {
  return function(owmObject) {
    owmObject = owmObject || {};

    var humidity = 'N/A';
    if ( typeof owmObject.main === 'object' ) {
      humidity = owmObject.main.humidity + '%';
    }

    return humidity;
  };
}]);

app.filter('wbWindSpeed', ['$filter', function($filter) {
  return function(owmObject) {
    owmObject = owmObject || {};

    var windSpeed = 'N/A';
    if ( typeof owmObject.wind === 'object' ) {
      windSpeed = owmObject.wind.speed + 'km/h';
    }

    return windSpeed;
  };
}]);

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

app.controller('SearchBarTermsController', ['$scope', 'SearchService', function($scope, SearchService) {

  $scope.terms = [];

  // Recieve terms updates
  SearchService.didUpdateTerms(function(terms, newTermsAdded) {
    $scope.terms = terms;
  });

}]);

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

  $scope.fetchWeatherData = function() {
    $scope.weatherData = [];
    var terms = $scope.terms;
    for (var i = 0; i < terms.length; i++) {
      var termName = terms[i];

      var row = angular.extend(copyObject(dataRowBase), {
        name: termName,
        isLoading: true,
        date: Date.now(),
      });

      $scope.weatherData.push(row);
    }

    // Fetch weather data for each location
    angular.forEach($scope.weatherData, function(object) {
      var request = SearchService.getWeatherDataByName(object.name);
      request.then(function(data) {
        // Success
        angular.extend(object, data);
        object.isLoading = false;
      }, function(response) {
        // Failed
      });
    });
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
