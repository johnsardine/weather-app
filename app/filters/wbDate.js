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
