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
