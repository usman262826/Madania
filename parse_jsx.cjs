const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/components/dashboard/Analytics.tsx', 'utf-8');

const sourceFile = ts.createSourceFile(
  'Analytics.tsx',
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

function traverse(node) {
  if (node.kind === ts.SyntaxKind.JsxElement) {
    const opening = node.openingElement.tagName.getText();
    const closing = node.closingElement.tagName.getText();
    if (opening !== closing) {
      console.log(`Mismatch: <${opening}> at line ${sourceFile.getLineAndCharacterOfPosition(node.openingElement.getStart()).line + 1} and </${closing}> at line ${sourceFile.getLineAndCharacterOfPosition(node.closingElement.getStart()).line + 1}`);
    }
  }
  if (node.kind === ts.SyntaxKind.JsxOpeningElement) {
    // console.log(`Opening: <${node.tagName.getText()}> at line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
  }
  ts.forEachChild(node, traverse);
}

// traverse(sourceFile);

// Actually, ts parses with error recovery, so let's just log the parsing diagnostics
const program = ts.createProgram(['src/components/dashboard/Analytics.tsx'], { jsx: ts.JsxEmit.React });
const diagnostics = ts.getPreEmitDiagnostics(program);
diagnostics.forEach(d => {
  if (d.file) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    console.log(`${d.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }
});
