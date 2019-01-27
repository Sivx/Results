angular.module('app', ['moment-picker'])
  .controller('results',
    function($scope, $http) {
      $scope.ctrl = {};
      $scope.DateRange = true;
      $scope.SaveQuickCommands = function() {
        window.localStorage.setItem("QuickCommands", JSON.stringify($scope.QuickCommands));
      };
      //Command History
      var QuickCommands = window.localStorage.getItem("QuickCommands");
      if (QuickCommands) {
        $scope.QuickCommands = JSON.parse(QuickCommands);
      } else {
        if (quickcommands) {
          $scope.QuickCommands = quickcommands();
        } else $scope.QuickCommands = [];
        $scope.SaveQuickCommands();
      }
      $scope.QuickCommand = function(command) {
        $scope.search = command.search;
        $scope.filetype = command.filetype;
        $scope.ctrl.start = moment(command.starttime, "YYYY-MM-DD HH:mm:ss");
        $scope.ctrl.end = moment(command.endtime, "YYYY-MM-DD HH:mm:ss");
      };
      $scope.InsertQuickCommand = function(command) {
        var found = false;
        for (var x = 0; x < $scope.QuickCommands.length; x++) {
          var tmp = $scope.QuickCommands[x];
          if (
            tmp.search == command.search &&
            tmp.filetype == command.filetype &&
            tmp.starttime == command.starttime &&
            tmp.endtime == command.endtime
          ) {
            found = true;
            break;
          }
        }
        if (!found) {
          $scope.QuickCommands.push(command);
          $scope.SaveQuickCommands();
        }
      };
      $scope.DeleteQuickCommand = function(command) {
        for (var x = 0; x < $scope.QuickCommands.length; x++) {
          var tmp = $scope.QuickCommands[x];
          if (
            tmp.search == command.search &&
            tmp.filetype == command.filetype &&
            tmp.starttime == command.starttime &&
            tmp.endtime == command.endtime
          ) {
            $scope.QuickCommands.splice(x, 1);
            $scope.SaveQuickCommands();
            break;
          }
        }
      };
      $scope.Run = function() {
        var start = null;
        var end = null;
        if ($scope.DateRange == true && $scope.ctrl) {
          start = $scope.ctrl.start;
          end = $scope.ctrl.end;
        }
        var output = {};
        var command = "/" + pcre2grep_complete($scope.search, output, $scope.filetype, start, end);
        console.log(decodeURIComponent(command));
        $http.get(command)
          .then(
            function(response) {
              //console.log(response.data.length);
              var split_lines = response.data.split("\n");
              $scope.results = split_lines;
              $scope.results_count = split_lines.length - 1;
              if (split_lines.length - 1 > 0) {
                //Insert Into Quick Command
                $scope.InsertQuickCommand({
                  search: $scope.search,
                  filetype: $scope.filetype,
                  starttime: start ? start._i : null,
                  endtime: end ? end._i : null
                });
              }
              if (output.run !== undefined) output.run(split_lines);
            });
      }
    });