var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parentPort } from 'node:worker_threads';
import { opendir } from 'node:fs/promises';
import { join } from 'node:path';
import EventEmitter from 'node:events';
(() => {
    let channel;
    let fileWalker;
    parentPort === null || parentPort === void 0 ? void 0 : parentPort.on('message', (data) => {
        if (data.type === 'startUp') { // 初始化
            const { id } = data.value;
            channel = data.value.channel;
            fileWalker = new FileWalker();
            initChannelListeners();
            initFileWalkerListeners();
        }
    });
    function initChannelListeners() {
        channel.on('message', (message) => {
            // console.log(message)
            if (message.type === 'scan') {
                fileWalker.enqueueTask(message.value.path);
            }
        });
    }
    function initFileWalkerListeners() {
        fileWalker.events.on('newResult', (result) => {
            channel.postMessage({ type: 'scanResult', value: { result } });
        });
    }
})();
class FileWalker {
    constructor() {
        this.taskQueue = [];
        this.events = new EventEmitter();
    }
    enqueueTask(path) {
        this.taskQueue.push({ path });
        this.processQueue();
    }
    processQueue() {
        while (this.taskQueue.length > 0) {
            const { path } = this.taskQueue.shift() || {};
            if (path === '' || path === undefined)
                return '';
            this.run(path);
        }
    }
    run(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dir = yield opendir(path);
                yield this.analysisDir(path, dir);
            }
            catch (error) {
            }
        });
    }
    analysisDir(path, dir) {
        return __awaiter(this, void 0, void 0, function* () {
            let entry = null;
            const result = [];
            while ((entry = yield dir.read().catch(() => null)) !== null) {
                // console.log(entry);
                const subpath = join(path, entry.name);
                // console.log(subpath);
                const shouldSkip = !entry.isDirectory();
                if (!shouldSkip) {
                    result.push({
                        path: subpath,
                        isTarget: entry.name === 'node_modules'
                    });
                }
            }
            this.events.emit('newResult', result);
            yield dir.close();
        });
    }
}
//# sourceMappingURL=scan.worker.js.map