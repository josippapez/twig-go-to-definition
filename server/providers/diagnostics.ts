import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode-languageserver/node';
import { TwigParser } from '../parser';
import { globalSettings } from '../config';

export async function validateTwigDocument(
  textDocument: TextDocument,
  parser: TwigParser,
  connection: any
): Promise<Diagnostic[]> {
  if (!parser || !globalSettings.diagnostics.enabled) {
    return [];
  }

  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];
  const template = parser.parse(textDocument);

  // Check if extended template exists
  if (template.extends) {
    const parentPath = parser.resolveTemplatePath(template.extends, textDocument.uri);
    if (!parentPath) {
      const extendsRegex = /\{%\s*extends\s+['"]([^'"]*)['"]\s*%\}/g;
      let match;
      while ((match = extendsRegex.exec(text)) !== null) {
        const start = textDocument.positionAt(match.index + match[0].indexOf(match[1]));
        const end = textDocument.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length);

        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: Range.create(start, end),
          message: `Template '${template.extends}' not found`,
          source: 'twig'
        });
      }
    }
  }

  // Check if included templates exist
  for (const includedTemplate of template.includes) {
    const includePath = parser.resolveTemplatePath(includedTemplate, textDocument.uri);
    if (!includePath) {
      const includeRegex = new RegExp(`\\{%\\s*include\\s+['"]${includedTemplate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      let match;
      while ((match = includeRegex.exec(text)) !== null) {
        const templateStart = match[0].indexOf(includedTemplate);
        const start = textDocument.positionAt(match.index + templateStart);
        const end = textDocument.positionAt(match.index + templateStart + includedTemplate.length);

        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: Range.create(start, end),
          message: `Template '${includedTemplate}' not found`,
          source: 'twig'
        });
      }
    }
  }

  // Check for block references that don't exist
  for (const [blockName, ranges] of Object.entries(template.blockReferences)) {
    let blockExists = false;

    // Check if block exists in current template
    if (template.blocks[blockName]) {
      blockExists = true;
    }

    // Check if block exists in parent templates
    if (!blockExists && template.extends) {
      const parentBlocks = parser.getBlocksFromParentTemplates(template.extends, textDocument.uri);
      if (parentBlocks.includes(blockName)) {
        blockExists = true;
      }
    }

    if (!blockExists) {
      for (const range of ranges) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: range,
          message: `Block '${blockName}' is not defined`,
          source: 'twig'
        });
      }
    }
  }

  // Check for unclosed blocks
  const blockStarts = text.match(/\{%\s*block\s+\w+\s*%\}/g) || [];
  const blockEnds = text.match(/\{%\s*endblock(?:\s+\w+)?\s*%\}/g) || [];

  if (blockStarts.length !== blockEnds.length) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      message: `Mismatched block tags: ${blockStarts.length} block starts, ${blockEnds.length} block ends`,
      source: 'twig'
    });
  }

  return diagnostics;
}
