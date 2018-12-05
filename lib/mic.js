const spawn = require('child_process').spawn;
const isMac = require('os').type() == 'Darwin';
const isWindows = require('os').type().indexOf('Windows') > -1;
const AudioStream = require('./silenceTransform.js');
const PassThrough = require('stream').PassThrough;

function mic({
    endian = 'little',
    bitwidth = 16,
    encoding = 'signed-integer',
    rate = 16000,
    channels = 1,
    device = 'plughw:1,0',
    exitOnSilence = 3,
    fileType = 'raw',
    debug = false,
} = {}) {
    let audioProcess = null;
    const infoStream = new PassThrough;
    const audioStream = new AudioStream({debug, silenceThreshold: parseInt(exitOnSilence, 10)});
    const audioProcessOptions = {
        stdio: ['ignore', 'pipe', debug ? 'pipe' : 'ignore']
    };
    
    function start() {
        if(audioProcess) return Promise.reject('Duplicate calls to start(): Microphone already started!');
        return new Promise((resolve, reject) => {
            try {
                if(isWindows){
                    audioProcess = spawn('sox', ['-b', bitwidth, '--endian', endian,
                        '-c', channels, '-r', rate, '-e', encoding,
                        '-t', 'waveaudio', 'default', '-p'],
                    audioProcessOptions);
                }
                else if(isMac){
                    audioProcess = spawn('rec', ['-b', bitwidth, '--endian', endian,
                        '-c', channels, '-r', rate, '-e', encoding,
                        '-t', fileType, '-'], audioProcessOptions);
                }
                else {
                    const formatEndian = endian==='big' ? 'BE' : 'LE';
                    const formatEncoding = encoding==='unsigned-integer' ? 'U' : 'S';
                    const format = `${formatEncoding}${bitwidth}_${formatEndian}`;
                    audioProcess = spawn('arecord', ['-t', fileType, '-c', channels, '-r', rate, '-f',
                        format, '-D', device], audioProcessOptions);
                }
            } catch(err) {
                console.error(err);
                const solution = isWindows ? 'https://github.com/JoFrhwld/FAVE/wiki/Sox-on-Windows'
                    : isMac ? 'https://github.com/JoFrhwld/FAVE/wiki/SoX-on-OS-X'
                        : 'sudo apt-get install sox';
                console.log('You need SoX to use this library:', solution);
                reject(err);
            }

            audioProcess.stdout.pipe(audioStream);
            if(debug) audioProcess.stderr.pipe(infoStream);
            resolve(audioStream);
        });
    }

    function stop() {
        if(!audioProcess) {
            if(debug) console.log('Microphone was alreday stopped');
            return Promise.resolve('Microphone was already stopped');
        }
        audioProcess.kill('SIGTERM');
        audioProcess = null;
        if(debug) console.log('Microphone stopped');
        return Promise.resolve('Microphone stopped');
    }

    function pause() {
        if(!audioProcess) {
            if(debug) console.log('Microphone is not started yet');
            return Promise.reject('Microphone is not started yet');
        }
        audioProcess.kill('SIGSTOP');
        audioStream.pause();
        if(debug) console.log('Microphone paused');
        return Promise.resolve('Microphone paused');
    }

    function resume() {
        if(!audioProcess) {
            if(debug) console.log('Microphone is not started yet');
            return Promise.reject('Microphone is not started yet');
        }
        audioProcess.kill('SIGCONT');
        audioStream.resume();
        if(debug) console.log('Microphone resumed');
        return Promise.resolve('Microphone resumed');
    }

    function getAudioStream() {
        return audioStream;
    }

    if(debug) {
        infoStream.on('data', function(data) {
            console.log('Received Info: ' + data);
        });
        infoStream.on('error', function(error) {
            console.log('Error in Info Stream: ' + error);
        });
    }

    return {
        start, stop, pause, resume, getAudioStream
    };
}

module.exports = mic;
