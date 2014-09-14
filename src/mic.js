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
