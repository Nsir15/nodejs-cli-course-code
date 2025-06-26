import {Worker,MessageChannel} from 'worker_threads'
// const {Worker,MessageChannel} = require('worker_threads')

const work1 = new Worker('./work.js')
const work2 = new Worker('./work.js')

const {port1,port2} = new MessageChannel()

work1.postMessage({port:port1},[port1]) // port1所有权转移给work1
work2.postMessage({port:port2},[port2]) // // port2所有权转移给work2

// 这里监听的是Worker线程自身的消息通道
// work1 监听work 的 message 事件，需要工作线程通过 parentPort.postMessage 发送消息才能接收到
work1.on('message',(msg)=>{
  console.log('Main thread received from work1:',msg)
})
work2.on('message',(msg)=>{
  console.log('Main thread received from work2:',msg)
})

// 监听 messageChannel 端口的信息
// 这里是不会执行到的
// 原因是： work1.postMessage({port:port1},[port1]) 传递 port1 时，port1 的所有权被转移到 work1 线程，
// 这意味着主线程不能再使用port1来接收消息，因为所有权已经转移了。因此，主线程中监听port1的message事件是无效的，因为port1已经不属于主线程了
port1.on('message',(msg)=>{
  console.log('Main thread received from port1:',msg)
})