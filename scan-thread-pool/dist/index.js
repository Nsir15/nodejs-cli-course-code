var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Subject } from 'rxjs';
import { ScanService } from './scan.js';
import getFolderSize from 'get-folder-size';
const stream = new Subject();
const scanService = new ScanService();
scanService.startScan('/Users/nx/Documents/study', stream);
stream.subscribe((data) => __awaiter(void 0, void 0, void 0, function* () {
    const size = yield getSize(data);
    console.log('扫描结果：', data, size);
}));
function getSize(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield getFolderSize(path);
            if (res && typeof res.size === 'number') {
                return (res.size / 1024 / 1024) + 'M';
            }
            return '0M';
        }
        catch (error) {
            console.error('获取文件夹大小失败:', error);
            return '0M';
        }
    });
}
//# sourceMappingURL=index.js.map