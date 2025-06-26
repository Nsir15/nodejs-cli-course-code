import { Subject } from 'rxjs';
import { ScanService } from './scan.js';
const stream = new Subject();
const scanService = new ScanService();
scanService.startScan('/Users/nx/Documents/study', stream);
stream.subscribe((data) => {
    console.log(data);
});
//# sourceMappingURL=index.js.map