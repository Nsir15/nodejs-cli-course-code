import {parentPort,MessagePort} from 'node:worker_threads'
import { TWorkMessage } from './scan.js'
import { opendir } from 'node:fs/promises';
import { Dir, Dirent } from 'node:fs';
import { join } from 'node:path';
import  EventEmitter  from 'node:events';

(()=>{

  let channel:MessagePort;
  let fileWalker:FileWalker;

  parentPort?.on('message',(data:TWorkMessage)=>{
    if(data.type === 'startUp'){ // 初始化
      const {id} = data.value
      channel = data.value.channel;
      fileWalker = new FileWalker();
      initChannelListeners();
      initFileWalkerListeners();
    }
  })

  function initChannelListeners(){
    channel.on('message',(message:TWorkMessage) => {
      // console.log(message)
      if(message.type === 'scan'){
        fileWalker.enqueueTask(message.value.path)
      }
    })
  }

  function initFileWalkerListeners(){
    fileWalker.events.on('newResult',(result:Record<string,any>[]) => {
      channel.postMessage({type:'scanResult',value:{result}})
    })
  }
})()

interface ITask{
  path:string
}

class FileWalker{
  private readonly taskQueue:ITask[] = [];
  readonly events = new EventEmitter()

  enqueueTask(path:string){
    this.taskQueue.push({path})
    this.processQueue();
  }

  private processQueue(){
    while(this.taskQueue.length > 0){
      const {path} = this.taskQueue.shift() || {}
      if(path === '' || path === undefined) return ''
      this.run(path)  
    }
  }

  private async run(path:string){
    try {
      const dir = await opendir(path);
      await this.analysisDir(path,dir);
    } catch (error) {
      
    }
  }

  private async analysisDir(path:string,dir:Dir){
    let entry:Dirent | null = null;
    const result:Record<string,any>[] = [];
    while((entry = await dir.read().catch(()=>null)) !== null){
      // console.log(entry);
      const subpath = join(path,entry.name)
      // console.log(subpath);
      const shouldSkip = !entry.isDirectory();
      if(!shouldSkip){
        result.push({
          path: subpath,
          isTarget: entry.name === 'node_modules'
        }) 
      }
    }
    this.events.emit('newResult',result);
    await dir.close()
  }
}