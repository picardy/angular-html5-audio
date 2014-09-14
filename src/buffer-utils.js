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