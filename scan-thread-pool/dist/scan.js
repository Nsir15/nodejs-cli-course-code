import { cpus } from 'node:os';
import { dirname, extname } from 'node:path';
import { URL } from 'node:url';
import { Worker } from 'node:worker_threads';
export class ScanService {
    constructor() {
        this.index = 0;
        this.workers = [];
        this.channels = [];
    }
    startScan(path, stream$) {
        this.initWorks();
        this.listenEvents(stream$);
        // 添加任务，开启目录扫描
        this.addJob({ job: 'scan', value: { path } });
    }
    getWorkerPath() {
        /**
         * import.meta.url 是 ES6 模块系统中获取当前模块路径的标准方式（需在 package.json 中声明 "type": "module"）
         * 替代了 CommonJS 中的 __filename 和 __dirname。
         * 它在浏览器和 Node.js 中均能可靠工作，尤其适合动态计算相对路径和资源加载。
         * 在现代 JavaScript 项目中，推荐优先使用 import.meta.url 处理模块路径相关逻辑。
         *
         * 获取的是 （URL 格式）： 示例： 'file:///Users/nx/Documents/study/%E5%89%8D%E7%AB%AF/nodejs-cli-course-code/scan-thread-pool/dist/scan.js'
         */
        const actualFilePath = import.meta.url;
        // 获取目录：file:///Users/nx/Documents/study/%E5%89%8D%E7%AB%AF/nodejs-cli-course-code/scan-thread-pool/dist
        const dirPath = dirname(actualFilePath);
        const extension = extname(actualFilePath);
        const workername = 'scan.worker';
        const url = new URL(`${dirPath}/${workername}${extension}`);
        return url;
    }
    initWorks() {
        const poolSize = cpus().length;
        for (let i = 0; i < poolSize; i++) {
            const worker = new Worker(this.getWorkerPath());
            const { port1, port2 } = new MessageChannel();
            // port2所有权转移给worker
            // worker 线程里通过 worker.on('message') 监听
            worker.postMessage({
                type: 'startUp',
                value: {
                    id: i,
                    channel: port2,
                }
            }, [port2]);
            this.workers.push(worker);
            this.channels.push(port1);
        }
    }
    listenEvents(stream$) {
        this.channels.forEach((channel) => {
            channel.on('message', (message) => {
                // console.log(message)
                const { type, value } = message;
                if (type === 'scanResult') {
                    const { result } = value;
                    result.forEach(({ path, isTarget }) => {
                        if (isTarget) {
                            stream$.next(path);
                        }
                        else {
                            this.addJob({ job: 'scan', value: { path } });
                        }
                    });
                }
            });
        });
    }
    addJob(job) {
        if (job.job === 'scan') {
            const channel = this.channels[this.index];
            const message = { type: 'scan', value: job.value };
            //这里的 channel 就是 port1,发送消息给 worker 线程里的 port2
            channel.postMessage(message);
            this.index = this.index >= this.channels.length - 1 ? 0 : this.index + 1;
        }
    }
}
//# sourceMappingURL=scan.js.map