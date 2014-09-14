(function () {

  'use strict';

  var app = angular.module('ngHTML5Audio.demo', ['ngHTML5Audio']);

  function MicController ($scope, HTML5AudioFeatures, HTML5AudioContext, HTML5AudioMic, HTML5AudioBufferUtils) {
    angular.extend($scope, {
      mic: HTML5AudioMic.createMic(),

      text: 'Turn mic on',

      toggle: function () {
        if ($scope.mic.streaming) {
          $scope.stop();
        } else if (!$scope.waiting) {
          $scope.start();
        }
      },

      start: function () {
        $scope.mic.start().then($scope.setup, $scope.onError);
      },

      stop: function () {
        $scope.mic.stop();
        $scope.teardown();
      },

      setup: function () {
        $scope.context = HTML5AudioContext.createContext({
          stream: $scope.mic.stream
        });

        $scope.context.createProcessor('monitor', {
          input: $scope.context.source,
          output: $scope.context.destination,
          process: function (event) {
            $scope.$apply(function () {
              $scope.buffer = event.inputBuffer.getChannelData(0);
            });
          }
        });
      },

      teardown: function () {
        delete $scope.context;
      },

      onError: function () {
        alert(':(');
      }
    });

    $scope.$watch(function () {
      return $scope.mic.streaming;
    }, function () {
      $scope.text = 'Turn mic ' + ($scope.mic.streaming ? 'off' : 'on');
    })
  }
  MicController.$inject = [
    '$scope',
    'HTML5AudioFeatures',
    'HTML5AudioContext',
    'HTML5AudioMic',
    'HTML5AudioBufferUtils'
  ];

  function BufferGraphDirective (HTML5AudioFeatures) {
    var margin = {top: 20, right: 20, bottom: 40, left: 50},
        width = 700 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    return {
      scope: {
        name: '@',
        buffer: '='
      },

      link: function (scope, elem, attrs) {
        var config = {};
        elem.attr('id', scope.name);

        config.x = d3.scale.linear().range([0, width]);
        config.y = d3.scale.linear().range([height, 0]);
        var xAxis = d3.svg.axis().scale(config.x).orient("bottom");
        var yAxis = d3.svg.axis().scale(config.y).orient("left");

        config.svg = d3.select("#" + scope.name)
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        config.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
        config.svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);
        config.path = config.svg.append('path')
          .attr('id', scope.name + '-path')
          .attr('class', 'line');
        config.line = d3.svg.line()
          .x(function(d) { return config.x(d.x); })
          .y(function(d) { return config.y(d.y); });

        function graph () {
          var data = [];

          if (scope.buffer) {
            // pull the buffer off of the scope and run with it
            for (var i = 0; i < scope.buffer.length; i++) {
              // graph resolution
              // if (idx > 600) return;
              data.push({
                x: i,
                y: scope.buffer[i]
              });
            }

            config.x.domain(d3.extent(data, function(d) { return d.x; }));
            config.y.domain(d3.extent(data, function(d) { return d.y; }));
            config.path.datum(data).attr('d', config.line);
          }

          HTML5AudioFeatures.requestAnimationFrame(graph);
        }

        // kick-off.
        graph();
      } 
    }
  }
  BufferGraphDirective.$inject = ['HTML5AudioFeatures'];

  app.controller('MicController', MicController);
  app.directive('bufferGraph', BufferGraphDirective);

}());

