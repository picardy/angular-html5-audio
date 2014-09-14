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