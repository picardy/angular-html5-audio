(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['angular'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('angular'));
  } else {
    factory(root.angular);
  }
}(this, function (angular) {
  'use strict';

  // filepath: src/Html5Audio.js
  var app = angular.module('ngHTML5Audio', []);
  
  app.service('HTML5AudioFeatures', AudioFeatures);
  app.service('HTML5AudioBufferUtils', BufferUtils);
  app.service('HTML5AudioContext', AudioContextService);
  app.service('HTML5AudioProcess', AudioProcesService);
  app.service('HTML5AudioMic', AudioMicService);
  
  return app;

  // filepath: src/buffer-utils.js
  function BufferUtils () {
    return {
      // returns a function that is to be used by a map to multiply a buffer
      // by some amount
      amplify: function (buffer, factor) {
        return buffer.map(function (sample) {
          return sample * factor;
        });
      },
  
      // get the average amplitude of a buffer in decibels.
      // dB = 20 * log10(rms)
      decibels: function (buffer) {
        var rmsValue = this.rms(buffer);
        return 20 * ( Math.log(rmsValue) / Math.log(10) );
      },
  
      // downsample a buffer by a whole integer for use in a HPS.
      downsample: function (buffer, size) {
        if (size % 1 !== 0) {
          throw 'BufferUtils.downsample() expects the size argument to be an integer.';
        }
  
        var newBuffer = [];
        for (var i = 0; i < buffer.length; i += size) {
          newBuffer.push(buffer[i]);
        }
        return newBuffer;
      },
  
      // apply a filter from an input buffer to an output buffer.
      // filter function takes original sample, idx in buffer, channel number as args.
      filter: function (inputBuffer, outputBuffer, filterFunction) {
        // default is a passthrough
        if (typeof filterFunction !== 'function') {
          filterFunction = function passthrough (sample) {
            return sample;
          };
        }
  
        // iterate through each channel. 
        for (var chan = 0; chan < inputBuffer.numberOfChannels; chan++) {
          var inputChannel = inputBuffer.getChannelData(chan),
              outputChannel = outputBuffer.getChannelData(chan),
              i;
  
          // iterate through the input channel, applying the function to each
          // index on the output channel
          for (i = 0; i < inputChannel.length; i++) {
            outputChannel[idx] = filterFunction(inputChannel[idx], idx, chan);
          }
        }
      },
      
      // get root mean square of a buffer. used for measuring amplitude
      rms: function (buffer) {
        var sumOfSquares = buffer.reduce(function (s, x) {
          return s + (x * x);
        }, 0);
        return Math.sqrt(sumOfSquares / buffer.length);
      }
    };
  }

  // filepath: src/context.js
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

  // filepath: src/features.js
  function AudioFeatures () {
    this.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    this.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
    this.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
    if (this.getUserMedia) {
      this.getUserMedia = angular.bind(navigator, this.getUserMedia);
    }
  
    if (this.requestAnimationFrame) {
      this.requestAnimationFrame = angular.bind(window, this.requestAnimationFrame);
    }
  
    this.supported = function () {
      return !!this.getUserMedia && !!this.AudioContext;
    };
  }

  // filepath: src/mic.js
  function AudioMicService ($q, HTML5AudioFeatures) {
    function Mic (options) {
      options = options || {};
  
      this.streaming = false;
      this.waiting = false;
  
      if (options.start) {
        this.start();
      }
    }
  
    Mic.prototype.start = function () {
      var d = $q.defer(),
          mic = this;
  
      if (!HTML5AudioFeatures.supported()) {
        throw 'Your device doesn\'t support getUserMedia.';
      }
  
      // already streaming
      if (this.stream) {
        if (!this.streaming) {
          this.stream.start();
        }
        
        d.resolve(this);
        return;
      }
  
      this.waiting = true;
      HTML5AudioFeatures.getUserMedia({ audio: true },
        function (stream) {
          mic.stream = stream;
          mic.streaming = true;
          mic.waiting = false;
          d.resolve(mic);
        },
        function (err) {
          mic.streaming = false;
          mic.waiting = false;
          d.reject(err);
        }
      );
  
      return d.promise;
    };
  
    Mic.prototype.stop = function () {
      if (!this.stream) {
        return;
      }
  
      this.stream.stop();
      delete this.stream;
      this.streaming = false;
      this.waiting = false;
    }
  
    this.Mic = Mic;
    this.createMic = function (options) {
      return new Mic(options);
    }
  }
  AudioMicService.$inject = ['$q', 'HTML5AudioFeatures'];
  

  // filepath: src/process.js
  function AudioProcesService () {
    /**
     * an audio process to be chained as part of an HTML5 AudioContext. 
     * https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode 
     *
     * @param context {AudioContext} an HTML5 AudioContext
     * @param options {Object} optional options that Processes can override
     *   @option input
     *   @option output
     */
    function Process (options) {
      options = options || {};
  
      this.initialize = (typeof options.process === 'function') ? options.initialize : this.initialize;
      this.process = (typeof options.process === 'function') ? options.process : this.process;
      this.input = options.input;
      this.output = options.output
  
      if (options.context) {
        this.setContext(options.context);
      }
  
      // use the setup function for our process
      if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
      }
  
      // if we passed an input, attach it.
      this.connect(this.input, this.output);
    }
  
    /**
     * attach a context
     * @param context {AudioContext} 
     */
    Process.prototype.setContext = function (context) {
      this.context = context;
    };
  
    /**
     * create a processor to be used by your process function
     * @param event {AudioProcessingEvent} the event fired from the audiocontext.
     */
    Process.prototype.setupProcessor = function () {
      if (!this.context) {
        throw 'AudioProcessor.createProcessor needs a context to create a processor on.';
      }
  
      this.processor = this.context.context.createScriptProcessor(this.context.size, 1, 1);
      return this.processor;
    };
  
    /**
     * attach the processor to a given input. 
     * @param input {AudioContext} input for the processor to listen to.
     * @param output {AudioContext} output for the processor to transmit to.
     */
    Process.prototype.connect = function (input, output) {
      this.input = input || this.input;
      this.output = output || this.output;
  
      if (!(this.input || this.output)) {
        throw 'Before connecting, an input or an output must be specified.';
      }
      
      this.setupProcessor();
      this.processor.onaudioprocess = angular.bind(this, this.process);
  
      if (this.input) {
        this.input.connect(this.processor);
      }
  
      if (this.output) {
        this.processor.connect(this.output);
      }
    };
  
    /**
     * attach the processor to a given input. 
     * @param input {AudioContextInput} input for the processor to listen to.
     */
    Process.prototype.disconnect = function () {
      if (!(this.input || this.output)) {
        return;
      }
  
      if (this.input) {
        this.input.disconnect(this.processor);
        delete this.input;
      }
  
      if (this.output) {
        this.processor.disconnect(this.output);
        delete this.output;
      }
    };
  
    /**
     * setup the process.
     * @param options {Object} the object is a thing
     */
    Process.prototype.initialize = function (options) {
      // this is a noop. override this function per in options.
    };
  
    /**
     * the function to be attached to onaudioprocess.
     * @param event {AudioProcessingEvent} the event fired from the audiocontext.
     */
    Process.prototype.process = function (event) {
      // this is a noop. override this function per in options.
    };
    
    this.Process = Process;
    this.createProcess = function (options) {
      return new Process(options);
    };
  }
}));
//# sourceMappingURL=angular-html5-audio.js.map