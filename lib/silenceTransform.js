const Transform = require('stream').Transform;

class AudioStream extends Transform {
    constructor({debug, threshold, silenceThreshold} = {}) {
        super();
        this.debug = debug;
        this.silenceThreshold = silenceThreshold;
        this.state = 'silence';
        this.silenceCount = 0;
        this.threshold = threshold;
    }
}

AudioStream.prototype._transform = function(chunk, encoding, callback) {
    let silenceLength = 0;
    for(let i=0; i<chunk.length; i+=2) {
        const speechSample = (chunk[i+1] > 128
            ? (chunk[i+1] - 256) * 256
            : chunk[i+1] * 256)
            + chunk[i];

        if(Math.abs(speechSample) > this.threshold) {
            if (this.debug) console.log('Found speech block');
            //emit 'sound' if we hear a sound after a silence
            if(this.state==='silence') {
                this.state = 'sound';
                this.emit('sound');
                this.silenceCount = 0;
            }
            break;
        } else {
            silenceLength++;
        }
    }

    if(silenceLength >= chunk.length/2) {
        this.silenceCount++;
        if (this.debug) {
            console.log('Found silence block: %d of %d', this.silenceCount, this.silenceThreshold);
        }
        //emit 'silence' only once each time the threshold condition is met
        if(this.state==='sound' && this.silenceCount>=this.silenceThreshold) {
            this.emit('silence');
            this.state = 'silence';
        }
    }
    this.push(chunk);
    callback();
};

module.exports = AudioStream;
