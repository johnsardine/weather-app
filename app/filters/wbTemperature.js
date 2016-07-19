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
