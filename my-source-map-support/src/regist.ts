import fs from 'fs';
import { SourceMap } from 'module';
import path from 'path';
import { SourceMapConsumer } from 'source-map';
import { fileURLToPath } from 'url';

/**
 * 返回被编译后的 js 文件里的 sourcemap 地址
 * @param source 
 */
function getSourceMapUrl(source:string):string{
  const fileData = fs.readFileSync(source,'utf-8');
  const regex = /# sourceMappingURL=(.*)$/g;
  let match,lastMatch;
  while (match = regex.exec(fileData)) {
    lastMatch = match;
  }
  if(!lastMatch) return ''
  return lastMatch[1];
}

export function wrapCallSite(frame:NodeJS.CallSite){
  const filename = frame.getFileName();
  if(filename){
    let position:Record<string,any> | null = {
      filename: filename,
      line: frame.getLineNumber(),
      column: frame.getColumnNumber()
    }
    // 本地业务代码的路径都是以 file:/ 开头的
    if(filename.startsWith('file:/')){
      position = mapSourcePosition(filename,position.line,position.column)
    }
    const newFrame:Record<string,any> = {}
    newFrame.getFunctionName = ()=>frame.getFunctionName();
    newFrame.getFileName = ()=>position?.source;
    newFrame.getLineNumber = ()=>position?.line;
    newFrame.getColumnNumber = ()=>position?.column;
    newFrame.toString = function(){
      return `${this.getFunctionName()} (${this.getFileName()}:${this.getLineNumber()}:${this.getColumnNumber()})`
    }
    return newFrame
  }
  return frame;
}


/**
 *  获取在 源码（ts 代码）中的位置
 * @param filename 
 * @param line 
 * @param column 
 */
function mapSourcePosition(filename:string,line:number,column:number){
  filename = fileURLToPath(filename)
  // 如果文件或目录不存在
  if(!fs.existsSync(filename)) return null
  const mapSourceUrl = getSourceMapUrl(filename)
  if(!mapSourceUrl) return null
  // 获取 业务代码的目录
  const dirname = path.dirname(filename)
  const mapSourcePath = path.join(dirname,mapSourceUrl);
  if(fs.existsSync(mapSourcePath)){
    const mapContent = fs.readFileSync(mapSourcePath,'utf-8');
    const map = new SourceMapConsumer(mapContent as any);
    const position =  map.originalPositionFor({
      line,
      column
    })
    return {
      source: path.join(dirname,position.source),
      line: position.line,
      column: position.column
    }
  }
  return null
}