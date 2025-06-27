const dgram = require('dgram');

// 创建一个 UDP 套接字，使用 IPv4
const server = dgram.createSocket('udp4');

//  监听 'message' 事件，处理接收到的 DNS 查询
server.on('message', (msg, rinfo) => {
  // msg 是接收到的 DNS 查询数据（Buffer 类型）
  // rinfo 包含客户端的地址和端口信息
  // console.log('server got message-msg:',msg);
  // console.log('server got message-rinfo:',rinfo);
  const host = parseHost(msg)
  if(/mrnan/.test(host)){
    console.log('host:',host);

    const response = createResponse(msg);
    server.send(response,rinfo.port,rinfo.address,(err)=>{
      if(err){
        console.log('响应失败:',err);
        server.close();
      }
    })
  }else{
    forward(msg,rinfo)
  }
});

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

// 监听 'listening' 事件，确认服务器启动
server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
})

server.bind(53,()=>{
  console.log('DNS 服务已经启动');
});


function parseHost(msg){
  // 头部固定 12个字节，后面才是查询或回答数据，所以从 12 开始.
  // 域名的存储格式是： 当前域长度 + 当前域内容 + 当前域长度 + 当前域内容 + 当前域长度 + 当前域内容 + 0；以 0 作为域名的结束
  // 比如 3 www 5 baidu 3 com
  let offset = 12 + 1;
  let len = msg.readUInt8(12);
  let host = ''
  while(msg[offset] !== 0){
    host += msg.slice(offset,offset+len).toString()
    offset += len
    len = msg.readUInt8(offset)
    if(len !== 0){
      host += '.'
    }
    offset += 1;
  }
  return host
}

function forward(msg,rinfo){
  const client = dgram.createSocket('udp4');
  client.on('message',(fMsg,fRinfo)=>{
    server.send(fMsg,fRinfo.port,fRinfo.address)
    client.close();
  })

  client.send(msg,53,'202.96.199.133',(err)=>{
    if(err){
      console.log('forward-error:',err);
      client.close()
    }
  })
}

function createResponse(msg){
  // 会话 ID 从传过来的 msg 取，flags 也设置下，问题数回答数都是 1，授权数、附加数都是 0。

  // 从 msg 中截取查询部分的 Buffer
  const queryInfo = msg.subarray(12);
  // 分配响应缓冲区
  /**
   * 为什么是 +16，不是随便的
   * 每条 Answer 资源记录（RR）的长度=
      NAME：2 字节（用指针方式写的，0xC00C）
      TYPE：2 字节（A 记录 = 1）
      CLASS：2 字节（IN = 1）
      TTL：4 字节
      RDLENGTH：2 字节（A记录IP长度=4字节）
      RDATA：4 字节（IPv4地址）
      合计：2 + 2 + 2 + 4 + 2 + 4 = 16 字节
   */
  // 不过我设置 16的话 下面的 copyBuffer会越界报错
  const response = Buffer.alloc(queryInfo.length + 28);

  // Transaction ID
  // 读取消息前2个字节并解析为无符号16位整数（大端序）
  const id = msg.readUInt16BE(0);
  // 获取消息前2个字节的原始Buffer片段
  // const id = msg.subarray(0,2);
  const flag = 0x8180;  // 标志：标准响应，无错误
  const qdcount = msg.readUInt16BE(4) // 问题数

  // 复制请求部分
  msg.copy(response,0,0,12+queryInfo.length);
  // 事务 ID
  response.writeUInt16BE(id,0)
  // 设置标志位
  response.writeUint16BE(flag,2)
  // 设置问题数
  response.writeUInt16BE(qdcount,4)
  // 设置回答数 为 1
  response.writeUInt16BE(1,6)
  // 设置授权数 0 Authority RRs
  response.writeUInt16BE(0,8)
  // 设置附加数 0 Additional RRs
  response.writeUInt16BE(0,10)

  // 回答部分
  // 域名使用指针压缩，指向问题部分的域名 (0xc00c) 
  // 0xc000 表示指针，0x0c 是偏移量 12
  let offset = 12+queryInfo.length;
  response.writeUint16BE(0xc00c, offset);
  offset += 2;
  // 设置 types 和 class 
  const typeAndClass = msg.subarray(msg.length -4);
  copyBuffer(typeAndClass,offset,response);
  offset += typeAndClass.length;

  // 设置 TTL 缓存时间 600s
  response.writeUInt32BE(600,offset);
  offset += 4;

  // 数据长度 4 字节 (IPv4 地址)
  response.writeUint16BE(4,offset);
  offset += 2;

  // 自定义 返回的 IP 地址
  '11.22.33.44'.split('.').forEach(value=>{
    response.writeUInt8(parseInt(value),offset);
    offset += 1;
  })
  return response
}

function copyBuffer(src,offset,des){
  for(let i = 0;i< src.length;i++){
    des.writeUInt8(src.readUInt8(i),offset + i);
  }
}