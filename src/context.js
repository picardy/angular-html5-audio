function AudioContextService (HTML5AudioFeatures, HTML5AudioProcess) {
  var PROCESSOR_SAMPLE_SIZE = 4096;

  /**
   * an object to wrap the AudioContext and assocated values with.
   * @param stream {MediaStream} stream provided by getUserMedia
   */
  function Context (options) {
    options = options || {};

    this.setupContext();

    this.size = options.size || PROCESSOR_SAMPLE_SIZE;
    this.processors = {};

    if (options.stream) {
      this.setStream(options.stream);
    }
  }

  Context.prototype.setupContext = function () {
    this.context = new HTML5AudioFeatures.AudioContext();
    this.destination = this.context.destination;
    this.sampleRate = this.context.sampleRate;
  }

  Context.prototype.setStream = function (stream) {
    this.stream = stream;
    this.source = this.context.createMediaStreamSource(this.stream);
  }

  Context.prototype.createProcessor = function (name, options) {
    if (this.processors.hasOwnProperty(name)) {
      throw 'A processor named ' + name + ' is already attached to this context.';
    }

    this.processors[name] = HTML5AudioProcess.createProcess(angular.extend({context: this}, options));

    return this.processors[name];
  }

  this.Context = Context;
  this.createContext = function (options) {
    return new Context(options);
  }
}

AudioContextService.$inject = ['HTML5AudioFeatures', 'HTML5AudioProcess'];