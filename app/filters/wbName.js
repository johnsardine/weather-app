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
