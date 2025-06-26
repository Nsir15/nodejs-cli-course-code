import {parentPort} from 'worker_threads'
// const {parentPort} = require('worker_threads')

parentPort.once('message',(msg)=>{
  if(msg.port){
    msg.port.on('message',(msg)=>{
      console.log('Worker thread received:',msg)
    })
    msg.port.postMessage('worker is ready')
  }
})
parentPort.postMessage('main thread is ready')