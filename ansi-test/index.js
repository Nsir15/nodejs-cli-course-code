import readline from 'node:readline';

// console.log('123\u001B[1K456');

/**
 * process.stdout：这是 Node.js 里的一个标准输出流对象，它代表着程序的标准输出，也就是终端。
 * process.stdout.rows：该属性表示当前终端窗口的行数。
 */
const repeatCount = process.stdout.rows -2;
const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : '';
console.log(blank);
// 移动光标
readline.cursorTo(process.stdout, 0, 0);
// 清空屏幕
readline.clearScreenDown(process.stdout);