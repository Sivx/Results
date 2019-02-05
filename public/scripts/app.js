var app = angular.module('app', ['moment-picker']);
app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
app
  .controller('results',
    function($scope, $http) {
      $scope.open_panels = [];
      $scope.modal = false;
      $scope.DateRange = false;
      $scope.ctrl = {};
      $scope.modal_error = false;
      $scope.add_to_panel = function() {
        if ($scope.panel_choice == "new") {
          $scope.modal = true;
        } else {
          console.log('here');
          InsertCommandToPanel($scope, $scope.panel_choice);
        }
      };
      $scope.open_panel = function() {
        Open_Panel($scope, $http, $scope.panel_choice);
      };
      Add_QuickCommands($scope);
      Add_QuickPanels($scope);

      $scope.close_modal = function() {
        $scope.modal = false;
      };
      $scope.Run = function() {
        var start = null;
        var end = null;
        if ($scope.DateRange == true && $scope.ctrl) {
          start = $scope.ctrl.start;
          end = $scope.ctrl.end;
        }
        Process_Command($http, $scope.search, $scope.filetype, start, end, "charts",
          function(results, results_count) {
            $scope.results = results;
            $scope.results_count = results_count;
            $scope.InsertQuickCommand({
              search: $scope.search,
              filetype: $scope.filetype,
              starttime: start ? start._i : null,
              endtime: end ? end._i : null
            });
          },
          function() {
            console.log("No results");
            $scope.results_count = 0;
          });
      }
    });

function Add_QuickCommands($scope) {
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
    if (command.starttime == null) {
      $scope.DateRange = false;
    } else {
      $scope.ctrl.start = moment(command.starttime, "YYYY-MM-DD HH:mm:ss");
      $scope.ctrl.end = moment(command.endtime, "YYYY-MM-DD HH:mm:ss");
    }
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
}

function Add_QuickPanels($scope) {
  $scope.SavePanels = function() {
    window.localStorage.setItem("Panels", JSON.stringify($scope.Panels));
  };
  //Command History
  var Panels = window.localStorage.getItem("Panels");
  if (Panels) {
    $scope.Panels = JSON.parse(Panels);
  } else {
    if (quickpanels) {
      $scope.Panels = quickpanels();
    } else $scope.Panels = [];
    $scope.SavePanels();
  }
  $scope.QuickPanel = function(command) {
    /*
    $scope.search = command.search;
    $scope.filetype = command.filetype;
    if (command.starttime == null) {
      $scope.DateRange = false;
    } else {
      $scope.ctrl.start = moment(command.starttime, "YYYY-MM-DD HH:mm:ss");
      $scope.ctrl.end = moment(command.endtime, "YYYY-MM-DD HH:mm:ss");
    }*/
  };
  $scope.InsertPanel = function() {
    $scope.modal_error = false;
    var panel_name = $scope.modal_panel;
    var found = false;
    for (var x = 0; x < $scope.Panels.length; x++) {
      var tmp = $scope.Panels[x];
      if (
        tmp.name == panel_name
      ) {
        found = true;
        break;
      }
    }
    if (!found) {
      $scope.Panels.push({
        "name": $scope.modal_panel + "",
        option: $scope.modal_panel + "",
        commands: []
      });
      $scope.SavePanels();
      $scope.modal = false;
    } else {
      $scope.modal_error = true;
    }
  };
  $scope.DeletePanel = function(panel) {
    for (var x = 0; x < $scope.Panels.length; x++) {
      var tmp = $scope.Panels[x];
      if (
        tmp.name == panel.name
      ) {
        $scope.Panels.splice(x, 1);
        $scope.SavePanels();
        break;
      }
    }
  };
  Get_Panel = function($scope, panel_name) {
    if (panel_name == "new") return false;
    var item;
    for (var x = 0; x < $scope.Panels.length; x++) {
      var tmp = $scope.Panels[x];
      if (
        tmp.name == panel_name
      ) {
        return tmp;
        break;
      }
    }
  };
  Open_Panel = function($scope, $http, panel_name) {
    if (panel_name == "new") return;
    var found = false;
    for (var x = 0; x < $scope.open_panels.length; x++) {
      var tmp = $scope.open_panels[x];
      if (
        tmp.name == panel_name
      ) {
        found = true;
        console.log('already open');
        break;
      }
    }
    if (!found) {
      var id = "charts" + $scope.open_panels.length;
      var item = {
        id: id,
        name: panel_name,
        show: true,
        show_chart: false,
        has_chart: false
      };
      $scope.open_panels.push(item);
      var panel = Get_Panel($scope, panel_name);
      if (panel != false) {
        for (var x = 0; x < panel.commands.length; x++) {
          var command = panel.commands[x];
          console.log(command);
          Process_Command($http, command.search, command.filetype, command.start, command.end, id + "_chart",
            function(results, results_count, has_chart) {
              item.results_count = results_count;
              item.results = results;
              if (has_chart) {
                item.show_chart = true;
                item.has_chart = true;
                console.log(item);
              } else {
                item.show_chart = false;
                item.has_chart = false;
              }
            },
            function() {
              item.results_count = 0;
              item.has_chart = false;
            });

        }
      }
    }
  };
  InsertCommandToPanel = function($scope, panel_name) {
    var found = false;
    for (var x = 0; x < $scope.Panels.length; x++) {
      var tmp = $scope.Panels[x];
      if (
        tmp.name == panel_name
      ) {
        found = true;
        var start = null;
        var end = null;
        if ($scope.DateRange == true && $scope.ctrl) {
          start = $scope.ctrl.start;
          end = $scope.ctrl.end;
        }
        tmp.commands.push({
          search: $scope.search,
          filetype: $scope.filetype,
          starttime: start ? start._i : null,
          endtime: end ? end._i : null
        });
        $scope.SavePanels();
        break;
      }
    }
  };
  Process_Command = function($http, command, folder, start, end, id, success_cb, no_results_cb, chain_panel, chain_index) {
    var output = {};
    var command = "/" + pcre2grep_complete(command, output, folder, start, end);
    console.log(decodeURIComponent(command));
    $http.get(command)
      .then(
        function(response) {
          //console.log(response.data.length);
          var split_lines = response.data.split("\n");
          var results = split_lines;
          var results_count = split_lines.length - 1;
          if (split_lines.length - 1 > 0) {
            var has_chart = output.run !== undefined;
            success_cb(results, results_count, has_chart);
            var run_id = id == null ? "charts" : id;
            if (has_chart) output.run(run_id, split_lines);
            //send next command
          } else {
            no_results_cb();
            //send next command
          }
        });
  }
}