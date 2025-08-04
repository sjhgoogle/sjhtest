"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mpeg1Muxer = void 0;
const node_child_process_1 = require("node:child_process");
const node_events_1 = require("node:events");
class Mpeg1Muxer extends node_events_1.EventEmitter {
    streamProcess;
    streamStarted = false;
    constructor(options) {
        super();
        if (!options || typeof options == 'undefined') {
            return;
        }
        if (!options.ffmpegPath) {
            return;
        }
        if (!options.url) {
            return;
        }
        let inputFfmpegArgs = [];
        if (options.ffmpegArgs) {
            inputFfmpegArgs = Object.keys(options.ffmpegArgs).flatMap(key => (options.ffmpegArgs?.[key] ? [key, options.ffmpegArgs[key]] : [key]));
        }
        const spawnFfmpegArgs = [
            '-rtsp_transport',
            'tcp',
            '-i',
            options.url,
            '-f',
            'mpegts',
            '-codec:v',
            'mpeg1video',
            ...inputFfmpegArgs,
            '-',
        ];
        this.streamProcess = (0, node_child_process_1.spawn)(options.ffmpegPath, spawnFfmpegArgs, { detached: options.shouldDetached });
        this.streamProcess.stdout?.on('data', data => {
            if (!this.streamStarted) {
                this.streamStarted = true;
            }
            this.emit('mpeg1data', data);
        });
        this.streamProcess.stderr?.on('data', (data) => {
            if (options.debug ?? false) {
                process.stderr.write(data);
            }
            if (data.toString('utf-8').includes('Server returned')) {
                const errorOutputLine = data.toString('utf-8');
                this.emit('liveErr', errorOutputLine.substr(errorOutputLine.indexOf('Server returned')));
                this.stop();
            }
        });
        this.streamProcess.on('exit', (code, signal) => {
            if (code != 0) {
                this.emit('ffmpeg process exited with error', code, signal);
            }
        });
        setTimeout(() => {
            if (!this.streamStarted) {
                this.emit('liveErr', 'Timeout');
                this.stop();
            }
        }, (options.timeout || 9) * 1000);
    }
    stop() {
        this.streamProcess?.kill();
        this.removeAllListeners();
    }
}
exports.Mpeg1Muxer = Mpeg1Muxer;
