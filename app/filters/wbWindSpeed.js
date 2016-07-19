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
