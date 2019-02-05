var pcre2grep = 'pcre2grep --line-buffered --no-filename --include ".log" -i -r --om-separator " " '; //);//\'AD\\d{5}\' * | sort |  uniq -c | sort -rk1'
var pcre2grep_complete = function(input, output, filetype, start, end) {
  var temp_base = pcre2grep;
  var pipes = input.split("|");
  for (var x = 0; x < pipes.length; x++) {
    pipes[x] = pipes[x].trim();
  }
  for (var x = 0; x < pipes.length; x++) {
    if (x == 0) {
      //base
      var groups = occurrences(pipes[0], "(", false);
      var end_groups = occurrences(pipes[0], ")", false);
      if (groups > end_groups) groups = end_groups;

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
        if (pipes[0].charAt(0) != '^') {
          temp_base += "-o1 ";
          pipes[0] = "^.*?(" + pipes[0] + ")";
        } else temp_base += "-o ";
      }
      pipes[0] = "'" + pipes[0] + "' ";
      if (x == 0 && start && end) {
        var files = [];
        filesBetweenDates(start, end, files);
        for (var i = 0; i < files.length; i++) {
          files[i] = "./" + filetype + "/" + files[i];
        }
        pipes[0] += files.join(' ');
      } else pipes[0] += "./" + filetype;
    } else {
      if (pipes[x].startsWith('group')) {
        var split = pipes[x].split(" ");
        if (split.length > 1) {
          var index_builder = ",\" \",$";
          var build_index = split[1];
          for (var i = 2; i < split.length; i++) {
            build_index += index_builder + split[i];
          }
          pipes[x] = "gawk '{N[$" + build_index + "]++}END{for(key in N){print N[key], key;}}'|sort -rn";
        } else {
          pipes[x] = 'sort | uniq -c | sort -r';
        }
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