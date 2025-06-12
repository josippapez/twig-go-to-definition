import { DocumentSymbolParams, DocumentSymbol, SymbolKind, Range, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TwigParser } from '../parser';
import { escapeRegex } from '../utils';

export function handleDocumentSymbol(
  params: DocumentSymbolParams,
  documents: Map<string, TextDocument> | { get(uri: string): TextDocument | undefined },
  parser: TwigParser,
  connection: any
): DocumentSymbol[] {
  const document = documents.get(params.textDocument.uri);
  if (!document || !parser) {
    return [];
  }

  connection.console.log(`Document symbol request for ${params.textDocument.uri}`);

  const symbols: DocumentSymbol[] = [];
  const template = parser.parse(document);
  const text = document.getText();

  // Add template extends information
  if (template.extends && template.extends.trim() !== '') {
    const extendsMatch = text.match(/\{%\s*extends\s+['"]([^'"]*)['"]/);
    if (extendsMatch) {
      const start = document.positionAt(extendsMatch.index!);
      const end = document.positionAt(extendsMatch.index! + extendsMatch[0].length);
      symbols.push({
        name: `extends "${template.extends}"`,
        detail: 'Template Inheritance',
        kind: SymbolKind.Namespace,
        range: Range.create(start, end),
        selectionRange: Range.create(start, end)
      });
    }
  }

  // Add blocks
  const blockSymbols: DocumentSymbol[] = [];
  for (const [blockName, range] of Object.entries(template.blocks)) {
    // Validate block name
    if (!blockName || blockName.trim() === '') {
      connection.console.warn(`Skipping block with empty name`);
      continue;
    }

    // Find the end of the block
    const blockStart = document.offsetAt(range.start);
    const blockEndRegex = new RegExp(`\\{%\\s*endblock(?:\\s+${escapeRegex(blockName)})?\\s*%\\}`, 'g');
    blockEndRegex.lastIndex = blockStart;
    const blockEndMatch = blockEndRegex.exec(text);

    let blockEndRange = range;
    if (blockEndMatch) {
      const blockEndPos = document.positionAt(blockEndMatch.index + blockEndMatch[0].length);
      blockEndRange = Range.create(range.start, blockEndPos);
    }

    blockSymbols.push({
      name: blockName,
      detail: 'Twig Block',
      kind: SymbolKind.Method,
      range: blockEndRange,
      selectionRange: range,
      children: []
    });
  }

  if (blockSymbols.length > 0) {
    symbols.push({
      name: 'Blocks',
      detail: `${blockSymbols.length} block(s)`,
      kind: SymbolKind.Class,
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      selectionRange: Range.create(Position.create(0, 0), Position.create(0, 0)),
      children: blockSymbols
    });
  }

  // Add includes
  const includeSymbols: DocumentSymbol[] = [];
  for (const includedTemplate of template.includes) {
    // Validate include template name
    if (!includedTemplate || includedTemplate.trim() === '') {
      connection.console.warn(`Skipping include with empty template name`);
      continue;
    }

    // Find include statements
    const includeRegex = new RegExp(`\\{%\\s*include\\s+['"]${escapeRegex(includedTemplate)}['"]`, 'g');
    let match;
    while ((match = includeRegex.exec(text)) !== null) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      includeSymbols.push({
        name: includedTemplate,
        detail: 'Included Template',
        kind: SymbolKind.File,
        range: Range.create(start, end),
        selectionRange: Range.create(start, end)
      });
    }
  }

  if (includeSymbols.length > 0) {
    symbols.push({
      name: 'Includes',
      detail: `${includeSymbols.length} include(s)`,
      kind: SymbolKind.Module,
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      selectionRange: Range.create(Position.create(0, 0), Position.create(0, 0)),
      children: includeSymbols
    });
  }

  // Add variables
  const variableSymbols: DocumentSymbol[] = [];
  const processedVars = new Set<string>();

  for (const [varName, ranges] of Object.entries(template.variables)) {
    // Validate variable name
    if (!varName || varName.trim() === '' || processedVars.has(varName)) {
      if (!varName || varName.trim() === '') {
        connection.console.warn(`Skipping variable with empty name`);
      }
      continue;
    }
    processedVars.add(varName);

    // Validate ranges array
    if (!ranges || ranges.length === 0) {
      connection.console.warn(`Skipping variable ${varName} with no ranges`);
      continue;
    }

    // Use the first occurrence as the main symbol
    const firstRange = ranges[0];
    variableSymbols.push({
      name: varName,
      detail: `Used ${ranges.length} time(s)`,
      kind: SymbolKind.Variable,
      range: firstRange,
      selectionRange: firstRange
    });
  }

  if (variableSymbols.length > 0) {
    symbols.push({
      name: 'Variables',
      detail: `${variableSymbols.length} variable(s)`,
      kind: SymbolKind.Object,
      range: Range.create(Position.create(0, 0), Position.create(0, 0)),
      selectionRange: Range.create(Position.create(0, 0), Position.create(0, 0)),
      children: variableSymbols
    });
  }

  connection.console.log(`Generated ${symbols.length} document symbols`);

  // Debug: Log all symbol names to check for empty ones
  symbols.forEach((symbol, index) => {
    connection.console.log(`Symbol ${index}: name="${symbol.name}", detail="${symbol.detail}", children=${symbol.children?.length || 0}`);
    if (symbol.children) {
      symbol.children.forEach((child, childIndex) => {
        connection.console.log(`  Child ${childIndex}: name="${child.name}", detail="${child.detail}"`);
      });
    }
  });

  return symbols;
}
