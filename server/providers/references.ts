import { ReferenceParams, Location, Range, Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import { TwigParser } from '../parser';
import { escapeRegex } from '../utils';

export function handleFindReferences(
  params: ReferenceParams,
  documents: Map<string, TextDocument> | { get(uri: string): TextDocument | undefined },
  parser: TwigParser,
  connection: any
): Location[] {
  const document = documents.get(params.textDocument.uri);
  if (!document || !parser) {
    return [];
  }

  connection.console.log(`Find references request for ${params.textDocument.uri} at ${params.position.line}:${params.position.character}`);

  const twigMatch = parser.findTwigMatchAtPosition(document, params.position);
  if (!twigMatch) {
    connection.console.log('No Twig match found for references');
    return [];
  }

  const references: Location[] = [];

  switch (twigMatch.type) {
    case 'extends':
    case 'include':
      // Find all places where this template is referenced
      if (twigMatch.templateName) {
        const templatePath = parser.resolveTemplatePath(twigMatch.templateName, document.uri);
        if (templatePath) {
          const templateUri = URI.file(templatePath).toString();
          references.push(...findTemplateReferences(twigMatch.templateName, templateUri, parser, connection));
        }
      }
      break;

    case 'block':
    case 'block_reference':
      // Find all places where this block is defined or referenced
      references.push(...findBlockReferences(twigMatch.name, document, parser, connection));
      break;

    case 'variable':
      // Find all places where this variable is used in the current template
      references.push(...findVariableReferences(twigMatch.name, document, parser));
      break;
  }

  connection.console.log(`Found ${references.length} references`);
  return references;
}

function findTemplateReferences(templateName: string, templateUri: string, parser: TwigParser, connection: any): Location[] {
  const references: Location[] = [];
  const allTemplates = parser.getAllTemplateFiles();

  for (const templatePath of allTemplates) {
    try {
      const content = fs.readFileSync(templatePath, 'utf8');
      const doc = TextDocument.create(
        URI.file(templatePath).toString(),
        'twig',
        1,
        content
      );

      // Find extends references
      const extendsRegex = new RegExp(`\\{%\\s*extends\\s+['"]${escapeRegex(templateName)}['"]`, 'g');
      let match;
      while ((match = extendsRegex.exec(content)) !== null) {
        const start = doc.positionAt(match.index + match[0].indexOf(templateName));
        const end = doc.positionAt(match.index + match[0].indexOf(templateName) + templateName.length);
        references.push(Location.create(doc.uri, Range.create(start, end)));
      }

      // Find include references
      const includeRegex = new RegExp(`\\{%\\s*include\\s+['"]${escapeRegex(templateName)}['"]`, 'g');
      while ((match = includeRegex.exec(content)) !== null) {
        const start = doc.positionAt(match.index + match[0].indexOf(templateName));
        const end = doc.positionAt(match.index + match[0].indexOf(templateName) + templateName.length);
        references.push(Location.create(doc.uri, Range.create(start, end)));
      }
    } catch (error) {
      connection.console.error(`Error reading template ${templatePath}: ${error}`);
    }
  }

  // Include the definition itself if requested
  if (templateUri) {
    references.push(Location.create(templateUri, Range.create(Position.create(0, 0), Position.create(0, 0))));
  }

  return references;
}

function findBlockReferences(blockName: string, document: TextDocument, parser: TwigParser, connection: any): Location[] {
  const references: Location[] = [];
  const template = parser.parse(document);

  // Add block definition in current template
  if (template.blocks[blockName]) {
    references.push(Location.create(document.uri, template.blocks[blockName]));
  }

  // Add block references in current template
  if (template.blockReferences[blockName]) {
    template.blockReferences[blockName].forEach(range => {
      references.push(Location.create(document.uri, range));
    });
  }

  // Search in parent and child templates
  const allTemplates = parser.getAllTemplateFiles();
  for (const templatePath of allTemplates) {
    if (templatePath === URI.parse(document.uri).fsPath) {
      continue; // Skip current template, already processed
    }

    try {
      const content = fs.readFileSync(templatePath, 'utf8');
      const doc = TextDocument.create(
        URI.file(templatePath).toString(),
        'twig',
        1,
        content
      );
      const templateInfo = parser.parse(doc);

      // Check if this template has the block
      if (templateInfo.blocks[blockName]) {
        references.push(Location.create(doc.uri, templateInfo.blocks[blockName]));
      }

      // Check if this template references the block
      if (templateInfo.blockReferences[blockName]) {
        templateInfo.blockReferences[blockName].forEach(range => {
          references.push(Location.create(doc.uri, range));
        });
      }
    } catch (error) {
      connection.console.error(`Error reading template ${templatePath}: ${error}`);
    }
  }

  return references;
}

function findVariableReferences(variableName: string, document: TextDocument, parser: TwigParser): Location[] {
  const references: Location[] = [];
  const template = parser.parse(document);

  // Add all variable references in current template
  if (template.variables[variableName]) {
    template.variables[variableName].forEach(range => {
      references.push(Location.create(document.uri, range));
    });
  }

  return references;
}
