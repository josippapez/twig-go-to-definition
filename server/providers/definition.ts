import { TextDocumentPositionParams, Definition, Location, Range, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { TwigParser } from '../parser';

export function handleGoToDefinition(
  params: TextDocumentPositionParams,
  documents: Map<string, TextDocument> | { get(uri: string): TextDocument | undefined },
  parser: TwigParser,
  connection: any
): Definition | null {
  connection.console.log(`Go to Definition request for ${params.textDocument.uri} at ${params.position.line}:${params.position.character}`);

  const document = documents.get(params.textDocument.uri);
  if (!document || !parser) {
    connection.console.log(`Document or parser not available. Document: ${!!document}, Parser: ${!!parser}`);
    return null;
  }

  const twigMatch = parser.findTwigMatchAtPosition(document, params.position);
  if (!twigMatch) {
    connection.console.log(`No Twig match found at position ${params.position.line}:${params.position.character}`);
    return null;
  }

  connection.console.log(`Found Twig match: type=${twigMatch.type}, name=${twigMatch.name}`);

  switch (twigMatch.type) {
    case 'extends':
    case 'include':
      if (twigMatch.templateName) {
        const templatePath = parser.resolveTemplatePath(twigMatch.templateName, document.uri);
        if (templatePath) {
          return Location.create(
            URI.file(templatePath).toString(),
            Range.create(Position.create(0, 0), Position.create(0, 0))
          );
        }
      }
      break;

    case 'block':
      // For block definitions, try to find the same block in parent template
      const template = parser.parse(document);
      if (template.extends) {
        const parentPath = parser.resolveTemplatePath(template.extends, document.uri);
        if (parentPath) {
          const blockRange = parser.findBlockInTemplate(parentPath, twigMatch.name);
          if (blockRange) {
            return Location.create(
              URI.file(parentPath).toString(),
              blockRange
            );
          }
        }
      }
      break;

    case 'block_reference':
      // For block() function calls, find the block definition
      return parser.findBlockDefinition(twigMatch.name, document);

    case 'parent_call':
      // For parent() calls, find the parent template's block
      const currentTemplate = parser.parse(document);
      if (currentTemplate.extends && twigMatch.blockName) {
        const parentPath = parser.resolveTemplatePath(currentTemplate.extends, document.uri);
        if (parentPath) {
          const blockRange = parser.findBlockInTemplate(parentPath, twigMatch.blockName);
          if (blockRange) {
            return Location.create(
              URI.file(parentPath).toString(),
              blockRange
            );
          }
        }
      }
      break;

    case 'variable':
      // For variables, try to find their definition in the current template or parent templates
      return parser.findVariableDefinition(twigMatch.name, document);
  }

  return null;
}
