var mic = require('../index.js');
var fs = require('fs');

var micInstance = mic({ 'rate': '16000', 'channels': '1', 'debug': true, 'exitOnSilence': 3 });
var micInputStream = micInstance.getAudioStream();

var outputFileStream = fs.WriteStream('output.raw');

micInputStream.pipe(outputFileStream);

var chunkCounter = 0;
micInputStream.on('data', function(data) {
    console.log('Recieved Input Stream of Size %d: %d', data.length, chunkCounter++);
});

micInputStream.on('error', function(err) {
    console.log('Error in Input Stream: ' + err);
});

micInstance.start();
