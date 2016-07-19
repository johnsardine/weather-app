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
