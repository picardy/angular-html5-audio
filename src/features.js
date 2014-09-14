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