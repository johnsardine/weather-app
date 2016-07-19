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
