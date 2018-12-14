var myPlot = document.getElementById('charts');

var pcre2grep_complete = function(input, output, start, end) {
  var temp_base = pcre2grep;
  var pipes = input.split("|");
  for (var x = 0; x < pipes.length; x++) {
    pipes[x] = pipes[x].trim();
  }
  for (var x = 0; x < pipes.length; x++) {
    if (x == 0) {
      //base
      var groups = occurrences(pipes[0], "(", false);

      if (pipes.length > 1) {
        var only_matching = false;
        var capture_time = false;
        var time_column = -1;
        for (var i = 1; i < pipes.length; i++) {
          if (pipes[i].startsWith('sort') ||
            pipes[i].startsWith('uniq') ||
            pipes[i].startsWith('group')) {
            only_matching = true;
            //break;
          } else if (pipes[i].startsWith('timegroup')) {
            //temp_base += "--line-buffered ";
            capture_time = true;
            only_matching = true;
          }
        }
        if (capture_time === true) {
          if (groups == 0) {
            groups = 2;
            pipes[0] = "^(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}).*?(" + pipes[0] + ")";
          } else {
            groups++;
            pipes[0] = "^(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}).*?" + pipes[0];
          }
        }
      }
      if (groups > 0) {
        for (var i = 0; i < groups; i++) {
          temp_base += "-o" + (i + 1) + " ";
        }
      } else if (groups === 0 && only_matching === true) {
        //
        if (pipes[0].charAt(0) != '^') {
          temp_base += "-o1 ";
          pipes[0] = "^.*?(" + pipes[0] + ")";
        } else temp_base += "-o ";
      }
      /*
      var words = pipes[0].split(" ");
      if(words.length > 0)
      {
          words[0] = "'"+words[0]+"'";
      }
      pipes[0] = words.join(" ");*/
      pipes[0] = "'" + pipes[0] + "' "; //./alert/2018";
      if (x == 0 && start && end) {
        var files = [];
        filesBetweenDates(start, end, files);
        for (var i = 0; i < files.length; i++) {
          files[i] = "./" + "alert/" + files[i];
        }
        pipes[0] += files.join(' ');
      } else pipes[0] += "./alert";
    } else {
      if (pipes[x].startsWith('group')) {
        pipes[x] = 'sort | uniq -c | sort -r';
      }
      if (pipes[x].startsWith('timegroup')) {
        pipes[x] = "gawk '{minute=int((x[2]+2.5)/5)*5;minute=(minute<10)?sprintf(\"0%d\",minute):minute;split($2,x,\":\");N[$1,\" \",x[1],\":\",minute,\":00 \",$3]++}END{for(key in N){print key, N[key];}}'";
      } else if (pipes[x].startsWith('head')) {
        var words = pipes[x].split(" ");
        if (words.length > 1) {
          if (!words[1].startsWith("-")) {
            words[1] = "-" + words[1];
          }
          words[0] = "'" + words[0] + "'";
        }
        pipes[x] = words.join(" ");
      } else if (pipes[x].startsWith('piechart')) {
        pipes.splice(x, 1);
        output.run = piechart;
      } else if (pipes[x].startsWith('barchart')) {
        pipes.splice(x, 1);
        output.run = barchart;
      } else if (pipes[x].startsWith('timechart')) {
        pipes.splice(x, 1);
        output.run = timechart;
      }
    }
  }
  return encodeURIComponent(temp_base + pipes.join("|"));
}

var pcre2grep = 'pcre2grep --line-buffered --no-filename --include ".log" -i -r --om-separator " " '; //);//\'AD\\d{5}\' * | sort |  uniq -c | sort -rk1'
angular.module('app', ['moment-picker'])
  .controller('results',
    function($scope, $http) {
      $scope.search = "\\w+exception|head 1";
      $scope.ctrl = {};
      $scope.ctrl.start = moment("2018-04-04 09:20:00", "YYYY-MM-DD HH:mm:ss");
      $scope.ctrl.end = moment("2018-04-04 10:55:00", "YYYY-MM-DD HH:mm:ss");
      $scope.results = [
        "Type the regex you are looking to capture. Then |",
        "group - gets the unique count by the first column. If you want graphs, Then |",
        "barchart or piechart - for graphs.",
        "Examples below.",
        "\\w+Exception | group | piechart",
        "\\w+Exception | group | barchart",
        "\\w+Exception | timegroup | timechart",
        "\\w+exception|timegroup|timechart"
      ];
      $scope.Run = function() {
        //if($scope.ctrl && $scope.ctrl.start !== undefined)console.log($scope.ctrl.start);
        //console.log($scope.ctrl.end);
        var start = null;
        var end = null;
        if ($scope.ctrl) {
          start = $scope.ctrl.start;
          end = $scope.ctrl.end;
        }
        var output = {};
        var command = "/" + pcre2grep_complete($scope.search, output, start, end);
        console.log(decodeURIComponent(command));
        $http.get(command)
          .then(
            function(response) {
              //console.log(response.data.length);
              var split_lines = response.data.split("\n");
              $scope.results = split_lines;
              $scope.results_count = split_lines.length - 1;
              if (output.run !== undefined) output.run(split_lines);
            });
      }
    });