'use strict';
function SoundReader(context) {
    this.context = context;
    this.talked = false;
    this.peak = 0.0;
    this.script = context.createScriptProcessor(2048, 1, 1);
    this.dest = context.createMediaStreamDestination();
    var ref = this;
    this.script.onaudioprocess = function (event) {
        const input = event.inputBuffer.getChannelData(0);
        var output = event.outputBuffer.getChannelData(0);
        var talked = false;
        var peak = 0.0;
        for (var i = 0; i < input.length; ++i) {
            if (Math.abs(input[i]) > peak) {
                peak = Math.abs(input[i]);
            }
            if (Math.abs(input[i]) > detectTalkingLevel) {
                talked = true;
                break;
            }
        }
        if (talked || !detectTalking) {
            for (var i = 0; i < output.length; i++) {
                output[i] = input[i];
            }
        } else {
            for (var i = 0; i < output.length; i++) {
                output[i] = 0;
            }
        }
        ref.talked = talked;
        ref.peak = peak;
    };
}

SoundReader.prototype.connectToSource = function (stream, callback) {
    try {
        this.mic = this.context.createMediaStreamSource(stream);
        this.mic.connect(this.script);
        this.script.connect(this.dest);

        if (typeof callback !== 'undefined') {
            callback(null);
        }
    } catch (e) {
        console.error(e);
        this.stop();
    }
};

SoundReader.prototype.stop = function () {
    this.mic.disconnect();
    this.script.disconnect();
};