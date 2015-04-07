(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./lib/main.js":[function(require,module,exports){
"use strict";
/* global require, define, module */

var eventDrops = require('./eventDrops');

if (typeof define === "function" && define.amd) {
  define('d3.chart.eventDrops', ["d3"], function (d3) {
    d3.chart = d3.chart || {};
    d3.chart.eventDrops = eventDrops(d3);
  });
} else if (window) {
  window.d3.chart = window.d3.chart || {};
  window.d3.chart.eventDrops = eventDrops(window.d3);
} else {
  module.exports = eventDrops;
}

},{"./eventDrops":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/eventDrops.js"}],"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/delimiter.js":[function(require,module,exports){
"use strict";
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');

var defaultConfig = {
  xScale: null,
  dateFormat: null
};

module.exports = function (config) {

  config = config || {};
  for (var key in defaultConfig) {
    config[key] = config[key] || defaultConfig[key];
  }

  function delimiter(selection) {
    selection.each(function (data) {
      d3.select(this).selectAll('text').remove();

      var limits = config.xScale.domain();

      d3.select(this).append('text')
        .text(function () {

          return config.dateFormat(limits[0]);
        })
        .classed('start', true)
      ;
      
      d3.select(this).append('text')
        .text(function() {
            return filterData(data[0].dates,
                              config.xScale).length
                   + " exams";
        })
        .attr('text-anchor', 'middle')
        .attr('class', 'times-exam-count')
        .attr('transform', 'translate(' + config.xScale.range()[1] / 2 + ')')
      ;

      d3.select(this).append('text')
        .text(function () {

          return config.dateFormat(limits[1]);
        })
        .attr('text-anchor', 'end')
        .attr('transform', 'translate(' + config.xScale.range()[1] + ')')
        .classed('end', true)
      ;
    });
  }

  configurable(delimiter, config);

  return delimiter;
};

},{"./filterData":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/filterData.js","./util/configurable":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/util/configurable.js"}],"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/eventDrops.js":[function(require,module,exports){
"use strict";
/* global require, module */

var configurable = require('./util/configurable');
var eventLine = require('./eventLine');
var delimiter = require('./delimiter');

module.exports = function (d3) {

  var defaultConfig = {
    start: new Date(0),
    end: new Date(),
    minScale: 0,
    maxScale: Infinity,
    width: 1000,
    margin: {
      top: 60,
      left: 200,
      bottom: 40,
      right: 50
    },
    locale: null,
    axisFormat: null,
    tickFormat: [
        [".%L", function(d) { return d.getMilliseconds(); }],
        [":%S", function(d) { return d.getSeconds(); }],
        ["%I:%M", function(d) { return d.getMinutes(); }],
        ["%I %p", function(d) { return d.getHours(); }],
        ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
        ["%b %d", function(d) { return d.getDate() != 1; }],
        ["%B", function(d) { return d.getMonth(); }],
        ["%Y", function() { return true; }]
    ],
    eventHover: null,
    eventZoom: null,
    hasDelimiter: true,
    hasTopAxis: true,
    hasLabels: true,
    hasBottomAxis: function (data) {
      return data.length >= 10;
    },
    eventLineColor: 'black',
    eventColor: null
  };

  return function eventDrops(config) {
    var xScale = d3.time.scale();
    var yScale = d3.scale.ordinal();
    config = config || {};
    for (var key in defaultConfig) {
      config[key] = config[key] || defaultConfig[key];
    }

    function eventDropGraph(selection) {
      selection.each(function (data) {
        var zoom = d3.behavior.zoom().center(null).scaleExtent([config.minScale, config.maxScale]).on("zoom", updateZoom);

        zoom.on("zoomend", zoomEnd);

        var graphWidth = config.width - config.margin.right - config.margin.left;
        var graphHeight = data.length * 15;
        var height = graphHeight + config.margin.top + config.margin.bottom;

        d3.select(this).select('svg').remove();

        var svg = d3.select(this)
          .append('svg')
          .attr('width', config.width)
          .attr('height', height)
        ;

        var graph = svg.append('g')
          .attr('transform', 'translate(0, 25)');

        var yDomain = [];
        var yRange = [];

        data.forEach(function (event, index) {
          yDomain.push(event.name);
          yRange.push(index * 40);
        });

        yScale.domain(yDomain).range(yRange);

        var yAxisEl = graph.append('g')
          .classed('y-axis', true)
          .attr('transform', 'translate(0, 60)');

        var yTick = yAxisEl.append('g').selectAll('g').data(yDomain);

        yTick.enter()
          .append('g')
          .attr('transform', function(d) {
            return 'translate(0, ' + yScale(d) + ')';
          })
          .append('line')
          .classed('y-tick', true)
          .attr('x1', config.margin.left)
          .attr('x2', config.margin.left + graphWidth);

        yTick.exit().remove();

        var curx, cury;
        var zoomRect = svg
          .append('rect')
          .call(zoom)
          .classed('zoom', true)
          .attr('width', graphWidth)
          .attr('height', height )
          .attr('transform', 'translate(' + config.margin.left + ', 35)')
        ;

        if (typeof config.eventHover === 'function') {
          zoomRect.on('mousemove', function(d, e) {
            var event = d3.event;
            if (curx == event.clientX && cury == event.clientY) return;
            curx = event.clientX;
            cury = event.clientY;
            zoomRect.attr('display', 'none');
            var el = document.elementFromPoint(d3.event.clientX, d3.event.clientY);
            zoomRect.attr('display', 'block');
            if (el.tagName !== 'circle') return;
            config.eventHover(el);
          });
        }

        xScale.range([0, graphWidth]).domain([config.start, config.end]);

        zoom.x(xScale);

        function updateZoom() {
          if (d3.event.sourceEvent.toString() === '[object MouseEvent]') {
            zoom.translate([d3.event.translate[0], 0]);
          }

          if (d3.event.sourceEvent.toString() === '[object WheelEvent]') {
            zoom.scale(d3.event.scale);
          }

          redraw();
        }

        function redrawDelimiter() {
          svg.select('.delimiter').remove();
          var delimiterEl = svg
            .append('g')
            .classed('delimiter', true)
            .attr('width', graphWidth)
            .attr('height', 10)
            .attr('transform', 'translate(' + config.margin.left + ', ' + (config.margin.top - 45) + ')')
            .call(delimiter({
              xScale: xScale,
              dateFormat: config.locale ? config.locale.timeFormat("%d %B %Y") : d3.time.format("%d %B %Y")
            }))
          ;
        }

        function zoomEnd() {
          if (config.eventZoom) {
            config.eventZoom(xScale);
          }
          if (config.hasDelimiter) {
            redrawDelimiter();
          }
        }

        function drawXAxis(where) {

          // copy config.tickFormat because d3 format.multi edit its given tickFormat data
          var tickFormatData = [];

          config.tickFormat.forEach(function (item) {
            var tick = item.slice(0);
            tickFormatData.push(tick);
          });

          var tickFormat = config.locale ? config.locale.timeFormat.multi(tickFormatData) : d3.time.format.multi(tickFormatData);
          var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient(where)
            .tickFormat(tickFormat)
          ;

          if (typeof config.axisFormat === 'function') {
            config.axisFormat(xAxis);
          }

          var y = (where == 'bottom' ? parseInt(graphHeight) : 0) + config.margin.top - 40;

          graph.select('.x-axis.' + where).remove();
          var xAxisEl = graph
            .append('g')
            .classed('x-axis', true)
            .classed(where, true)
            .attr('transform', 'translate(' + config.margin.left + ', ' + y + ')')
            .call(xAxis)
          ;
        }

        function redraw() {

          var hasTopAxis = typeof config.hasTopAxis === 'function' ? config.hasTopAxis(data) : config.hasTopAxis;
          if (hasTopAxis) {
            drawXAxis('top');
          }

          var hasBottomAxis = typeof config.hasBottomAxis === 'function' ? config.hasBottomAxis(data) : config.hasBottomAxis;
          if (hasBottomAxis) {
            drawXAxis('bottom');
          }

          zoom.size([config.width, height]);

          graph.select('.graph-body').remove();
          var graphBody = graph
            .append('g')
            .classed('graph-body', true)
            .attr('transform', 'translate(' + config.margin.left + ', ' + (config.margin.top - 15) + ')');

          var lines = graphBody.selectAll('g').data(data);

          lines.enter()
            .append('g')
            .classed('line', true)
            .attr('transform', function(d) {
              return 'translate(0,' + yScale(d.name) + ')';
            })
            .style('fill', config.eventLineColor)
            .call(eventLine({ xScale: xScale, eventColor: config.eventColor, hasLabels: config.hasLabels }))
          ;

          lines.exit().remove();
        }

        redraw();
        if (config.hasDelimiter) {
          redrawDelimiter();
        }
        if (config.eventZoom) {
          config.eventZoom(xScale);
        }
      });
    }

    configurable(eventDropGraph, config);

    return eventDropGraph;
  };
};

},{"./delimiter":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/delimiter.js","./eventLine":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/eventLine.js","./util/configurable":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/util/configurable.js"}],"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/eventLine.js":[function(require,module,exports){
"use strict";
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');

var defaultConfig = {
  xScale: null
};

module.exports = function (config) {

  config = config || {
    xScale: null,
    eventColor: null
  };
  for (var key in defaultConfig) {
    config[key] = config[key] || defaultConfig[key];
  }

  var eventLine = function eventLine(selection) {
    selection.each(function (data) {
      d3.select(this).selectAll('text').remove();

      if (config.hasLabels) {
          d3.select(this).append('text')
            .text(function(d) {
              var count = filterData(d.dates, config.xScale).length;
              return d.name + (count > 0 ? ' (' + count + ')' : '');
            })
            .attr('text-anchor', 'end')
            .attr('transform', 'translate(-20)')
            .style('fill', 'black')
          ;
      }

      d3.select(this).selectAll('circle').remove();

      var circle = d3.select(this).selectAll('circle')
        .data(function(d) {
          // filter value outside of range
          return filterData(d.dates, config.xScale);
        });

      circle.enter()
        .append('circle')
        .attr('cx', function(d) {
          return config.xScale(d);
        })
        .style('fill', config.eventColor)
        .attr('cy', -5)
        .attr('r', 10)
      ;

      circle.exit().remove();
    });
  };

  configurable(eventLine, config);

  return eventLine;
};

},{"./filterData":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/filterData.js","./util/configurable":"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/util/configurable.js"}],"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/filterData.js":[function(require,module,exports){
"use strict";
/* global module */

module.exports = function filterDate(data, scale) {
  data = data || [];
  var filteredData = [];
  var boundary = scale.range();
  var min = boundary[0];
  var max = boundary[1];
  data.forEach(function (datum) {
    var value = scale(datum);
    if (value < min || value > max) {
      return;
    }
    filteredData.push(datum);
  });

  return filteredData;
};

},{}],"/Users/bc/exam-traffic/resources/public/js/lib/EventDrops/lib/util/configurable.js":[function(require,module,exports){
module.exports = function configurable(targetFunction, config, listeners) {
  listeners = listeners || {};
  for (var item in config) {
    (function(item) {
      targetFunction[item] = function(value) {
        if (!arguments.length) return config[item];
        config[item] = value;
        if (listeners.hasOwnProperty(item)) {
          listeners[item](value);
        }

        return targetFunction;
      };
    })(item); // for doesn't create a closure, forcing it
  }
};

},{}]},{},["./lib/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL2xpYi9tYWluLmpzIiwiL1VzZXJzL2JjL2V4YW0tdHJhZmZpYy9yZXNvdXJjZXMvcHVibGljL2pzL2xpYi9FdmVudERyb3BzL2xpYi9kZWxpbWl0ZXIuanMiLCIvVXNlcnMvYmMvZXhhbS10cmFmZmljL3Jlc291cmNlcy9wdWJsaWMvanMvbGliL0V2ZW50RHJvcHMvbGliL2V2ZW50RHJvcHMuanMiLCIvVXNlcnMvYmMvZXhhbS10cmFmZmljL3Jlc291cmNlcy9wdWJsaWMvanMvbGliL0V2ZW50RHJvcHMvbGliL2V2ZW50TGluZS5qcyIsIi9Vc2Vycy9iYy9leGFtLXRyYWZmaWMvcmVzb3VyY2VzL3B1YmxpYy9qcy9saWIvRXZlbnREcm9wcy9saWIvZmlsdGVyRGF0YS5qcyIsIi9Vc2Vycy9iYy9leGFtLXRyYWZmaWMvcmVzb3VyY2VzL3B1YmxpYy9qcy9saWIvRXZlbnREcm9wcy9saWIvdXRpbC9jb25maWd1cmFibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgZGVmaW5lLCBtb2R1bGUgKi9cblxudmFyIGV2ZW50RHJvcHMgPSByZXF1aXJlKCcuL2V2ZW50RHJvcHMnKTtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZSgnZDMuY2hhcnQuZXZlbnREcm9wcycsIFtcImQzXCJdLCBmdW5jdGlvbiAoZDMpIHtcbiAgICBkMy5jaGFydCA9IGQzLmNoYXJ0IHx8IHt9O1xuICAgIGQzLmNoYXJ0LmV2ZW50RHJvcHMgPSBldmVudERyb3BzKGQzKTtcbiAgfSk7XG59IGVsc2UgaWYgKHdpbmRvdykge1xuICB3aW5kb3cuZDMuY2hhcnQgPSB3aW5kb3cuZDMuY2hhcnQgfHwge307XG4gIHdpbmRvdy5kMy5jaGFydC5ldmVudERyb3BzID0gZXZlbnREcm9wcyh3aW5kb3cuZDMpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBldmVudERyb3BzO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbCxcbiAgZGF0ZUZvcm1hdDogbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cbiAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVsaW1pdGVyKHNlbGVjdGlvbikge1xuICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCd0ZXh0JykucmVtb3ZlKCk7XG5cbiAgICAgIHZhciBsaW1pdHMgPSBjb25maWcueFNjYWxlLmRvbWFpbigpO1xuXG4gICAgICBkMy5zZWxlY3QodGhpcykuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5kYXRlRm9ybWF0KGxpbWl0c1swXSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jbGFzc2VkKCdzdGFydCcsIHRydWUpXG4gICAgICA7XG4gICAgICBcbiAgICAgIGQzLnNlbGVjdCh0aGlzKS5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAudGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJEYXRhKGRhdGFbMF0uZGF0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcueFNjYWxlKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICArIFwiIGV4YW1zXCI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAndGltZXMtZXhhbS1jb3VudCcpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBjb25maWcueFNjYWxlLnJhbmdlKClbMV0gLyAyICsgJyknKVxuICAgICAgO1xuXG4gICAgICBkMy5zZWxlY3QodGhpcykuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5kYXRlRm9ybWF0KGxpbWl0c1sxXSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgY29uZmlnLnhTY2FsZS5yYW5nZSgpWzFdICsgJyknKVxuICAgICAgICAuY2xhc3NlZCgnZW5kJywgdHJ1ZSlcbiAgICAgIDtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbmZpZ3VyYWJsZShkZWxpbWl0ZXIsIGNvbmZpZyk7XG5cbiAgcmV0dXJuIGRlbGltaXRlcjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBldmVudExpbmUgPSByZXF1aXJlKCcuL2V2ZW50TGluZScpO1xudmFyIGRlbGltaXRlciA9IHJlcXVpcmUoJy4vZGVsaW1pdGVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGQzKSB7XG5cbiAgdmFyIGRlZmF1bHRDb25maWcgPSB7XG4gICAgc3RhcnQ6IG5ldyBEYXRlKDApLFxuICAgIGVuZDogbmV3IERhdGUoKSxcbiAgICBtaW5TY2FsZTogMCxcbiAgICBtYXhTY2FsZTogSW5maW5pdHksXG4gICAgd2lkdGg6IDEwMDAsXG4gICAgbWFyZ2luOiB7XG4gICAgICB0b3A6IDYwLFxuICAgICAgbGVmdDogMjAwLFxuICAgICAgYm90dG9tOiA0MCxcbiAgICAgIHJpZ2h0OiA1MFxuICAgIH0sXG4gICAgbG9jYWxlOiBudWxsLFxuICAgIGF4aXNGb3JtYXQ6IG51bGwsXG4gICAgdGlja0Zvcm1hdDogW1xuICAgICAgICBbXCIuJUxcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXRNaWxsaXNlY29uZHMoKTsgfV0sXG4gICAgICAgIFtcIjolU1wiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmdldFNlY29uZHMoKTsgfV0sXG4gICAgICAgIFtcIiVJOiVNXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0TWludXRlcygpOyB9XSxcbiAgICAgICAgW1wiJUkgJXBcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXRIb3VycygpOyB9XSxcbiAgICAgICAgW1wiJWEgJWRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXREYXkoKSAmJiBkLmdldERhdGUoKSAhPSAxOyB9XSxcbiAgICAgICAgW1wiJWIgJWRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXREYXRlKCkgIT0gMTsgfV0sXG4gICAgICAgIFtcIiVCXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0TW9udGgoKTsgfV0sXG4gICAgICAgIFtcIiVZXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfV1cbiAgICBdLFxuICAgIGV2ZW50SG92ZXI6IG51bGwsXG4gICAgZXZlbnRab29tOiBudWxsLFxuICAgIGhhc0RlbGltaXRlcjogdHJ1ZSxcbiAgICBoYXNUb3BBeGlzOiB0cnVlLFxuICAgIGhhc0xhYmVsczogdHJ1ZSxcbiAgICBoYXNCb3R0b21BeGlzOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuIGRhdGEubGVuZ3RoID49IDEwO1xuICAgIH0sXG4gICAgZXZlbnRMaW5lQ29sb3I6ICdibGFjaycsXG4gICAgZXZlbnRDb2xvcjogbnVsbFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBldmVudERyb3BzKGNvbmZpZykge1xuICAgIHZhciB4U2NhbGUgPSBkMy50aW1lLnNjYWxlKCk7XG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLm9yZGluYWwoKTtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2ZW50RHJvcEdyYXBoKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpLnNjYWxlRXh0ZW50KFtjb25maWcubWluU2NhbGUsIGNvbmZpZy5tYXhTY2FsZV0pLm9uKFwiem9vbVwiLCB1cGRhdGVab29tKTtcblxuICAgICAgICB6b29tLm9uKFwiem9vbWVuZFwiLCB6b29tRW5kKTtcblxuICAgICAgICB2YXIgZ3JhcGhXaWR0aCA9IGNvbmZpZy53aWR0aCAtIGNvbmZpZy5tYXJnaW4ucmlnaHQgLSBjb25maWcubWFyZ2luLmxlZnQ7XG4gICAgICAgIHZhciBncmFwaEhlaWdodCA9IGRhdGEubGVuZ3RoICogMTU7XG4gICAgICAgIHZhciBoZWlnaHQgPSBncmFwaEhlaWdodCArIGNvbmZpZy5tYXJnaW4udG9wICsgY29uZmlnLm1hcmdpbi5ib3R0b207XG5cbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgnc3ZnJykucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIHN2ZyA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgLmF0dHIoJ3dpZHRoJywgY29uZmlnLndpZHRoKVxuICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXG4gICAgICAgIDtcblxuICAgICAgICB2YXIgZ3JhcGggPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAyNSknKTtcblxuICAgICAgICB2YXIgeURvbWFpbiA9IFtdO1xuICAgICAgICB2YXIgeVJhbmdlID0gW107XG5cbiAgICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCwgaW5kZXgpIHtcbiAgICAgICAgICB5RG9tYWluLnB1c2goZXZlbnQubmFtZSk7XG4gICAgICAgICAgeVJhbmdlLnB1c2goaW5kZXggKiA0MCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHlTY2FsZS5kb21haW4oeURvbWFpbikucmFuZ2UoeVJhbmdlKTtcblxuICAgICAgICB2YXIgeUF4aXNFbCA9IGdyYXBoLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmNsYXNzZWQoJ3ktYXhpcycsIHRydWUpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgNjApJyk7XG5cbiAgICAgICAgdmFyIHlUaWNrID0geUF4aXNFbC5hcHBlbmQoJ2cnKS5zZWxlY3RBbGwoJ2cnKS5kYXRhKHlEb21haW4pO1xuXG4gICAgICAgIHlUaWNrLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwgJyArIHlTY2FsZShkKSArICcpJztcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5jbGFzc2VkKCd5LXRpY2snLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd4MScsIGNvbmZpZy5tYXJnaW4ubGVmdClcbiAgICAgICAgICAuYXR0cigneDInLCBjb25maWcubWFyZ2luLmxlZnQgKyBncmFwaFdpZHRoKTtcblxuICAgICAgICB5VGljay5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIGN1cngsIGN1cnk7XG4gICAgICAgIHZhciB6b29tUmVjdCA9IHN2Z1xuICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgIC5jYWxsKHpvb20pXG4gICAgICAgICAgLmNsYXNzZWQoJ3pvb20nLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodCApXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGNvbmZpZy5tYXJnaW4ubGVmdCArICcsIDM1KScpXG4gICAgICAgIDtcblxuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5ldmVudEhvdmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgem9vbVJlY3Qub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGQsIGUpIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuICAgICAgICAgICAgaWYgKGN1cnggPT0gZXZlbnQuY2xpZW50WCAmJiBjdXJ5ID09IGV2ZW50LmNsaWVudFkpIHJldHVybjtcbiAgICAgICAgICAgIGN1cnggPSBldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY3VyeSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgICB6b29tUmVjdC5hdHRyKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCwgZDMuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgICB6b29tUmVjdC5hdHRyKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgICBpZiAoZWwudGFnTmFtZSAhPT0gJ2NpcmNsZScpIHJldHVybjtcbiAgICAgICAgICAgIGNvbmZpZy5ldmVudEhvdmVyKGVsKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHhTY2FsZS5yYW5nZShbMCwgZ3JhcGhXaWR0aF0pLmRvbWFpbihbY29uZmlnLnN0YXJ0LCBjb25maWcuZW5kXSk7XG5cbiAgICAgICAgem9vbS54KHhTY2FsZSk7XG5cbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlWm9vbSgpIHtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICB6b29tLnRyYW5zbGF0ZShbZDMuZXZlbnQudHJhbnNsYXRlWzBdLCAwXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgem9vbS5zY2FsZShkMy5ldmVudC5zY2FsZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVkcmF3KCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZWRyYXdEZWxpbWl0ZXIoKSB7XG4gICAgICAgICAgc3ZnLnNlbGVjdCgnLmRlbGltaXRlcicpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciBkZWxpbWl0ZXJFbCA9IHN2Z1xuICAgICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAuY2xhc3NlZCgnZGVsaW1pdGVyJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMTApXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgY29uZmlnLm1hcmdpbi5sZWZ0ICsgJywgJyArIChjb25maWcubWFyZ2luLnRvcCAtIDQ1KSArICcpJylcbiAgICAgICAgICAgIC5jYWxsKGRlbGltaXRlcih7XG4gICAgICAgICAgICAgIHhTY2FsZTogeFNjYWxlLFxuICAgICAgICAgICAgICBkYXRlRm9ybWF0OiBjb25maWcubG9jYWxlID8gY29uZmlnLmxvY2FsZS50aW1lRm9ybWF0KFwiJWQgJUIgJVlcIikgOiBkMy50aW1lLmZvcm1hdChcIiVkICVCICVZXCIpXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB6b29tRW5kKCkge1xuICAgICAgICAgIGlmIChjb25maWcuZXZlbnRab29tKSB7XG4gICAgICAgICAgICBjb25maWcuZXZlbnRab29tKHhTY2FsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb25maWcuaGFzRGVsaW1pdGVyKSB7XG4gICAgICAgICAgICByZWRyYXdEZWxpbWl0ZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkcmF3WEF4aXMod2hlcmUpIHtcblxuICAgICAgICAgIC8vIGNvcHkgY29uZmlnLnRpY2tGb3JtYXQgYmVjYXVzZSBkMyBmb3JtYXQubXVsdGkgZWRpdCBpdHMgZ2l2ZW4gdGlja0Zvcm1hdCBkYXRhXG4gICAgICAgICAgdmFyIHRpY2tGb3JtYXREYXRhID0gW107XG5cbiAgICAgICAgICBjb25maWcudGlja0Zvcm1hdC5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICB2YXIgdGljayA9IGl0ZW0uc2xpY2UoMCk7XG4gICAgICAgICAgICB0aWNrRm9ybWF0RGF0YS5wdXNoKHRpY2spO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHRpY2tGb3JtYXQgPSBjb25maWcubG9jYWxlID8gY29uZmlnLmxvY2FsZS50aW1lRm9ybWF0Lm11bHRpKHRpY2tGb3JtYXREYXRhKSA6IGQzLnRpbWUuZm9ybWF0Lm11bHRpKHRpY2tGb3JtYXREYXRhKTtcbiAgICAgICAgICB2YXIgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgICAgICAuc2NhbGUoeFNjYWxlKVxuICAgICAgICAgICAgLm9yaWVudCh3aGVyZSlcbiAgICAgICAgICAgIC50aWNrRm9ybWF0KHRpY2tGb3JtYXQpXG4gICAgICAgICAgO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuYXhpc0Zvcm1hdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uZmlnLmF4aXNGb3JtYXQoeEF4aXMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciB5ID0gKHdoZXJlID09ICdib3R0b20nID8gcGFyc2VJbnQoZ3JhcGhIZWlnaHQpIDogMCkgKyBjb25maWcubWFyZ2luLnRvcCAtIDQwO1xuXG4gICAgICAgICAgZ3JhcGguc2VsZWN0KCcueC1heGlzLicgKyB3aGVyZSkucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIHhBeGlzRWwgPSBncmFwaFxuICAgICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAuY2xhc3NlZCgneC1heGlzJywgdHJ1ZSlcbiAgICAgICAgICAgIC5jbGFzc2VkKHdoZXJlLCB0cnVlKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGNvbmZpZy5tYXJnaW4ubGVmdCArICcsICcgKyB5ICsgJyknKVxuICAgICAgICAgICAgLmNhbGwoeEF4aXMpXG4gICAgICAgICAgO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVkcmF3KCkge1xuXG4gICAgICAgICAgdmFyIGhhc1RvcEF4aXMgPSB0eXBlb2YgY29uZmlnLmhhc1RvcEF4aXMgPT09ICdmdW5jdGlvbicgPyBjb25maWcuaGFzVG9wQXhpcyhkYXRhKSA6IGNvbmZpZy5oYXNUb3BBeGlzO1xuICAgICAgICAgIGlmIChoYXNUb3BBeGlzKSB7XG4gICAgICAgICAgICBkcmF3WEF4aXMoJ3RvcCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBoYXNCb3R0b21BeGlzID0gdHlwZW9mIGNvbmZpZy5oYXNCb3R0b21BeGlzID09PSAnZnVuY3Rpb24nID8gY29uZmlnLmhhc0JvdHRvbUF4aXMoZGF0YSkgOiBjb25maWcuaGFzQm90dG9tQXhpcztcbiAgICAgICAgICBpZiAoaGFzQm90dG9tQXhpcykge1xuICAgICAgICAgICAgZHJhd1hBeGlzKCdib3R0b20nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB6b29tLnNpemUoW2NvbmZpZy53aWR0aCwgaGVpZ2h0XSk7XG5cbiAgICAgICAgICBncmFwaC5zZWxlY3QoJy5ncmFwaC1ib2R5JykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIGdyYXBoQm9keSA9IGdyYXBoXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5jbGFzc2VkKCdncmFwaC1ib2R5JywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBjb25maWcubWFyZ2luLmxlZnQgKyAnLCAnICsgKGNvbmZpZy5tYXJnaW4udG9wIC0gMTUpICsgJyknKTtcblxuICAgICAgICAgIHZhciBsaW5lcyA9IGdyYXBoQm9keS5zZWxlY3RBbGwoJ2cnKS5kYXRhKGRhdGEpO1xuXG4gICAgICAgICAgbGluZXMuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAuY2xhc3NlZCgnbGluZScsIHRydWUpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgwLCcgKyB5U2NhbGUoZC5uYW1lKSArICcpJztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpXG4gICAgICAgICAgICAuY2FsbChldmVudExpbmUoeyB4U2NhbGU6IHhTY2FsZSwgZXZlbnRDb2xvcjogY29uZmlnLmV2ZW50Q29sb3IsIGhhc0xhYmVsczogY29uZmlnLmhhc0xhYmVscyB9KSlcbiAgICAgICAgICA7XG5cbiAgICAgICAgICBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWRyYXcoKTtcbiAgICAgICAgaWYgKGNvbmZpZy5oYXNEZWxpbWl0ZXIpIHtcbiAgICAgICAgICByZWRyYXdEZWxpbWl0ZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uZmlnLmV2ZW50Wm9vbSkge1xuICAgICAgICAgIGNvbmZpZy5ldmVudFpvb20oeFNjYWxlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uZmlndXJhYmxlKGV2ZW50RHJvcEdyYXBoLCBjb25maWcpO1xuXG4gICAgcmV0dXJuIGV2ZW50RHJvcEdyYXBoO1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgeFNjYWxlOiBudWxsLFxuICAgIGV2ZW50Q29sb3I6IG51bGxcbiAgfTtcbiAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgfVxuXG4gIHZhciBldmVudExpbmUgPSBmdW5jdGlvbiBldmVudExpbmUoc2VsZWN0aW9uKSB7XG4gICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJ3RleHQnKS5yZW1vdmUoKTtcblxuICAgICAgaWYgKGNvbmZpZy5oYXNMYWJlbHMpIHtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgdmFyIGNvdW50ID0gZmlsdGVyRGF0YShkLmRhdGVzLCBjb25maWcueFNjYWxlKS5sZW5ndGg7XG4gICAgICAgICAgICAgIHJldHVybiBkLm5hbWUgKyAoY291bnQgPiAwID8gJyAoJyArIGNvdW50ICsgJyknIDogJycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTIwKScpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnYmxhY2snKVxuICAgICAgICAgIDtcbiAgICAgIH1cblxuICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnY2lyY2xlJykucmVtb3ZlKCk7XG5cbiAgICAgIHZhciBjaXJjbGUgPSBkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCdjaXJjbGUnKVxuICAgICAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgICAgLy8gZmlsdGVyIHZhbHVlIG91dHNpZGUgb2YgcmFuZ2VcbiAgICAgICAgICByZXR1cm4gZmlsdGVyRGF0YShkLmRhdGVzLCBjb25maWcueFNjYWxlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIGNpcmNsZS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLnhTY2FsZShkKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnN0eWxlKCdmaWxsJywgY29uZmlnLmV2ZW50Q29sb3IpXG4gICAgICAgIC5hdHRyKCdjeScsIC01KVxuICAgICAgICAuYXR0cigncicsIDEwKVxuICAgICAgO1xuXG4gICAgICBjaXJjbGUuZXhpdCgpLnJlbW92ZSgpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbmZpZ3VyYWJsZShldmVudExpbmUsIGNvbmZpZyk7XG5cbiAgcmV0dXJuIGV2ZW50TGluZTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCBtb2R1bGUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXJEYXRlKGRhdGEsIHNjYWxlKSB7XG4gIGRhdGEgPSBkYXRhIHx8IFtdO1xuICB2YXIgZmlsdGVyZWREYXRhID0gW107XG4gIHZhciBib3VuZGFyeSA9IHNjYWxlLnJhbmdlKCk7XG4gIHZhciBtaW4gPSBib3VuZGFyeVswXTtcbiAgdmFyIG1heCA9IGJvdW5kYXJ5WzFdO1xuICBkYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdHVtKSB7XG4gICAgdmFyIHZhbHVlID0gc2NhbGUoZGF0dW0pO1xuICAgIGlmICh2YWx1ZSA8IG1pbiB8fCB2YWx1ZSA+IG1heCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaWx0ZXJlZERhdGEucHVzaChkYXR1bSk7XG4gIH0pO1xuXG4gIHJldHVybiBmaWx0ZXJlZERhdGE7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb25maWd1cmFibGUodGFyZ2V0RnVuY3Rpb24sIGNvbmZpZywgbGlzdGVuZXJzKSB7XG4gIGxpc3RlbmVycyA9IGxpc3RlbmVycyB8fCB7fTtcbiAgZm9yICh2YXIgaXRlbSBpbiBjb25maWcpIHtcbiAgICAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdGFyZ2V0RnVuY3Rpb25baXRlbV0gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjb25maWdbaXRlbV07XG4gICAgICAgIGNvbmZpZ1tpdGVtXSA9IHZhbHVlO1xuICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XG4gICAgICAgICAgbGlzdGVuZXJzW2l0ZW1dKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXRGdW5jdGlvbjtcbiAgICAgIH07XG4gICAgfSkoaXRlbSk7IC8vIGZvciBkb2Vzbid0IGNyZWF0ZSBhIGNsb3N1cmUsIGZvcmNpbmcgaXRcbiAgfVxufTtcbiJdfQ==
