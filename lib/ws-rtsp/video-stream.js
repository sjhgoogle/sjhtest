"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoStream = void 0;
const node_events_1 = require("node:events");
const ws_1 = require("ws");
const mpeg1_muxer_1 = require("./mpeg1-muxer");
function getUrl(url) {
    try {
        const parsedUrl = new URL(url, 'http://localhost');
        return parsedUrl.searchParams.get('url');
    }
    catch {
        return null;
    }
}
class VideoStream extends node_events_1.EventEmitter {
    liveMuxers = new Map();
    wsServer;
    options;
    liveMuxerListeners = new Map();
    constructor(opt) {
        super();
        this.options = opt;
        process.on('beforeExit', () => {
            this.stop();
        });
    }
    start(expressServer) {
        this.wsServer = new ws_1.Server({
            // port: this.options?.wsPort || 9999,
            server: expressServer,
        });
        this.wsServer.on('connection', (socket, request) => {
            if (!request.url) {
                return;
            }
            const liveUrl = getUrl(request.url);
            if (!liveUrl) {
                return;
            }
            console.info('Socket connected', request.url);
            socket.id = Date.now().toString();
            socket.liveUrl = liveUrl;
            if (this.liveMuxers.has(liveUrl)) {
                const muxer = this.liveMuxers.get(liveUrl);
                if (muxer) {
                    const listenerFunc = (data) => {
                        socket.send(data);
                    };
                    muxer.on('mpeg1data', listenerFunc);
                    this.liveMuxerListeners.set(`${liveUrl}-${socket.id}`, listenerFunc);
                }
            }
            else {
                const muxer = new mpeg1_muxer_1.Mpeg1Muxer({
                    ...this.options,
                    url: liveUrl,
                });
                this.liveMuxers.set(liveUrl, muxer);
                muxer.on('liveErr', (errMsg) => {
                    console.info('Error go live', errMsg);
                    socket.send(4104);
                    // code should be in [4000,4999] ref https://tools.ietf.org/html/rfc6455#section-7.4.2
                    socket.close(4104, errMsg);
                });
                const listenerFunc = (data) => {
                    socket.send(data);
                };
                muxer.on('mpeg1data', listenerFunc);
                this.liveMuxerListeners.set(`${liveUrl}-${socket.id}`, listenerFunc);
            }
            socket.on('close', () => {
                console.info('Socket closed');
                if (this.wsServer?.clients.size == 0) {
                    if (this.liveMuxers.size > 0) {
                        [...this.liveMuxers.values()].forEach((skt) => {
                            skt.stop();
                        });
                    }
                    this.liveMuxers = new Map();
                    this.liveMuxerListeners = new Map();
                    return;
                }
                const socketLiveUrl = socket.liveUrl;
                const socketId = socket.id;
                if (this.liveMuxers.has(socketLiveUrl)) {
                    const muxer = this.liveMuxers.get(socketLiveUrl);
                    if (!muxer) {
                        return;
                    }
                    const listenerFunc = this.liveMuxerListeners.get(`${socketLiveUrl}-${socketId}`);
                    if (listenerFunc) {
                        muxer.removeListener('mpeg1data', listenerFunc);
                    }
                    if (muxer.listenerCount('mpeg1data') == 0) {
                        muxer.stop();
                        this.liveMuxers.delete(socketLiveUrl);
                        this.liveMuxers.delete(`${socketLiveUrl}-${socketId}`);
                    }
                }
            });
        });
        console.info('Stream server started!');
    }
    stop() {
        this.wsServer?.close();
        if (this.liveMuxers.size > 0) {
            [...this.liveMuxers.values()].forEach((skt) => {
                skt.stop();
            });
        }
    }
}
exports.VideoStream = VideoStream;
