const fs = require('fs');
const code = fs.readFileSync('src/components/dashboard/Analytics.tsx', 'utf-8');

let stack = [];
let lineNo = 1;
for (let i = 0; i < code.length; i++) {
  if (code[i] === '\n') lineNo++;
  
  // Very naive JSX tag matcher
  if (code[i] === '<') {
    let j = i + 1;
    let isClosing = false;
    if (code[j] === '/') {
      isClosing = true;
      j++;
    }
    let tagName = '';
    while (j < code.length && /[a-zA-Z0-9_-]/.test(code[j])) {
      tagName += code[j];
      j++;
    }
    if (tagName && !/^[A-Z]/.test(tagName) && tagName !== 'br' && tagName !== 'hr' && tagName !== 'input' && tagName !== 'img') {
       // if we hit `/>` it's self closing. Let's see if it's self closing
       let k = j;
       let selfClosing = false;
       while (k < code.length && code[k] !== '>') {
         if (code[k] === '/' && code[k+1] === '>') selfClosing = true;
         if (code[k] === '\n') lineNo++;
         k++;
       }
       if (code[k] === '>') {
         if (!selfClosing) {
           if (isClosing) {
             let last = stack.pop();
             if (last && last.name !== tagName) {
                console.log(`Mismatch at line ${lineNo}: expected </${last.name}> but found </${tagName}>. Opened at ${last.line}`);
             }
           } else {
             stack.push({name: tagName, line: lineNo});
           }
         }
       }
       i = k;
    }
  }
}
console.log('Unclosed tags:', stack.map(s => `${s.name} at line ${s.line}`));
