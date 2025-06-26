import { Subject } from 'rxjs';
import {ScanService} from './scan.js';
import getFolderSize from 'get-folder-size';

const stream = new Subject<string>();

const scanService = new ScanService();
scanService.startScan('/Users/nx/Documents/study',stream);


stream.subscribe(async (data) => {
  const size = await getSize(data);
  console.log('扫描结果：',data,size)
})

async function getSize(path: string) {
  try {
    const res = await getFolderSize(path);
    if (res && typeof res.size === 'number') {
      return (res.size / 1024 / 1024) + 'M';
    }
    return '0M';
  } catch (error) {
    console.error('获取文件夹大小失败:', error);
    return '0M';
  }
}
