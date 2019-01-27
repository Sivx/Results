function timechart(data) {
  var lines = {};

  for (var x = 0; x < data.length - 1; x++) {
    var split = data[x].replace(/\u001c/g, '').split(' ');
    var time = split[0] + " " + split[1]; //substring(0, 19);
    var _time = moment(time, "YYYY-MM-DD HH:mm:ss");
    var type = split[2];
    var count = split[3];
    if (!(type in lines)) {
      lines[type] = {
        x: [],
        y: [],
        _t: [],
        type: "scatter",
        mode: "lines+markers",
        name: type,
      };
    }
    var added = false;
    for (var i = 0; i < lines[type].x.length; i++) {
      if (_time.isBefore(lines[type]._t[i])) {
        lines[type]._t.splice(i, 0, _time);
        lines[type].x.splice(i, 0, time);
        lines[type].y.splice(i, 0, count);
        added = true;
        break;
      }
    }
    if (!added) {
      lines[type]._t.push(_time);
      lines[type].x.push(time);
      lines[type].y.push(count);
    }
  }

  var arr = [];

  for (var propt in lines) {
    var tmp = lines[propt];
    var _pointer = tmp._t[0].add(5, 'minutes');
    //fill in gaps in traces with 0
    for (var x = 1; x < tmp._t.length; x++) {
      while (_pointer.isBefore(tmp._t[x])) {
        tmp._t.splice(x, 0, _pointer.clone());
        tmp.x.splice(x, 0, _pointer.format("YYYY-MM-DD HH:mm:ss"));
        tmp.y.splice(x, 0, 0);
        _pointer = _pointer.add(5, 'minutes');
        x++;
      }
      //else if i match
      _pointer = _pointer.add(5, 'minutes');
    }
    arr.push(lines[propt]);
  }

  var layout = {
    title: 'Time Series',
    xaxis: {
      'type': 'date'
    },
  };

  Plotly.newPlot('charts', arr, layout);
}

function chart(data, type) {
  var values = [];
  var labels = [];
  var response = {
    type: type
  }
  if (type == 'pie') {
    response.values = values;
    response.labels = labels;
  } else if (type == 'bar') {
    response.x = labels;
    response.y = values;
  }
  for (var x = 0; x < data.length - 1; x++) {
    var split = data[x].trim().split(" ");
    values.push(split[0]);
    labels.push(split[1]);
  }
  Plotly.newPlot('charts', [response]);
  var myPlot = document.getElementById('charts');
  myPlot.on('plotly_click', function(data) {
    console.log(data.points);
    for (var i = 0; i < data.points.length; i++) {
      alert(data.points[i].label || data.points[i].x)
    }
  });
}

function piechart(data) {
  chart(data, 'pie')
}

function barchart(data) {
  chart(data, 'bar')
}