angular.module('app_cmd', [])
  .controller('cmd',
    function($scope, $http) {
      $scope.command = "";
      $scope.results = [
        "Type the command you want to run.",
        "Examples below.",
        "\\w+Exception | group | piechart",
        "\\w+Exception | group | barchart",
        "\\w+Exception | timegroup | timechart",
        "\\w+exception|timegroup|timechart"
      ];
      $scope.Run = function() {
        var command = "/" + $scope.command;
        console.log(decodeURIComponent(command));
        $http.get(command)
          .then(
            function(response) {
              //console.log(response.data.length);
              var split_lines = response.data.split("\n");
              $scope.results = split_lines;
              $scope.results_count = split_lines.length - 1;
            });
      }
    });