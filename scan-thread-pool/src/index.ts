import { Subject } from 'rxjs';
import {ScanService} from './scan.js';

const stream = new Subject<string>();

const scanService = new ScanService();
scanService.startScan('/Users/nx/Documents/study',stream);


stream.subscribe((data) => {
  console.log(data)
})
