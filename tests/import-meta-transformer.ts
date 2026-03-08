/**
 * ts-jest AST transformer: replaces `import.meta.url` with a CJS-compatible
 * expression so that Jest (which runs in CJS mode) can handle ESM source
 * that uses `import.meta.url` for __dirname / __filename derivation.
 *
 * The replacement is:
 *   require('url').pathToFileURL(__filename).href
 *
 * This is semantically equivalent in Node CJS modules.
 */
import type { TsCompilerInstance } from 'ts-jest';
import ts from 'typescript';

const IMPORT_META_URL_REPLACEMENT = `require('url').pathToFileURL(__filename).href`;

function visitor(ctx: ts.TransformationContext) {
  const visit: ts.Visitor<ts.Node, ts.Node> = (node: ts.Node): ts.Node => {
    // Match: import.meta.url
    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === 'url' &&
      ts.isMetaProperty(node.expression) &&
      node.expression.keywordToken === ts.SyntaxKind.ImportKeyword
    ) {
      return ts.factory.createIdentifier(IMPORT_META_URL_REPLACEMENT);
    }

    // Match: import.meta.dirname
    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === 'dirname' &&
      ts.isMetaProperty(node.expression) &&
      node.expression.keywordToken === ts.SyntaxKind.ImportKeyword
    ) {
      return ts.factory.createIdentifier('__dirname');
    }

    // Match: import.meta (bare, e.g. typeof import.meta)
    // Leave alone — only transform .url and .dirname access

    return ts.visitEachChild(node, visit, ctx);
  };
  return visit;
}

export const name = 'import-meta-transformer';
export const version = 1;

export function factory(_compiler: TsCompilerInstance) {
  return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx)) as ts.SourceFile;
  };
}
