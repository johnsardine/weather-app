app.factory('SearchService', ['$http', '$q', function($http, $q) {

  var OWMAppId = '2a9faaa7ba7170d8184bf0786516667d';
  var OWMUnits = 'metric';
  var OWMWeatherEndpoint = 'http://api.openweathermap.org/data/2.5/weather?appid=' + OWMAppId + '&units=' + OWMUnits;
  var OWMNameSuggestionEndpoint = 'http://sdn.pt/github/weather-app/search.php';

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
