var app = angular.module('ngHTML5Audio', []);

app.service('HTML5AudioFeatures', AudioFeatures);
app.service('HTML5AudioBufferUtils', BufferUtils);
app.service('HTML5AudioContext', AudioContextService);
app.service('HTML5AudioProcess', AudioProcesService);
app.service('HTML5AudioMic', AudioMicService);

return app;