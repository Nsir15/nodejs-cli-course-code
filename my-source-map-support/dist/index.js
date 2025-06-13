import { wrapCallSite } from './regist.js';
Error.prepareStackTrace = (error, stack) => {
    // console.log('error:',error);
    // console.log('stack:',stack);
    const name = error.name || 'ERROR';
    const message = error.message || '';
    const errorMsg = name + ':' + message;
    const processStack = [];
    for (let i = 0; i < stack.length; i++) {
        const processMsg = stack[i];
        // console.log('processMsg:',processMsg + '');
        processStack.push('\n  atat  ' + wrapCallSite(processMsg));
    }
    return errorMsg + processStack.join('');
};
function add(a, b) {
    if (a === 1) {
        throw new Error('a is 1');
    }
    return a + b;
}
function main() {
    console.log(add(1, 2));
}
main();
//# sourceMappingURL=index.js.map