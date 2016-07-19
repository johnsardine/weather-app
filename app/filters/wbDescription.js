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
