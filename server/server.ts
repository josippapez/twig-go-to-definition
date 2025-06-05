import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Definition,
  Location,
  Range,
  Position
} from 'vscode-languageserver/node';

import {
  TextDocument
} from 'vscode-languageserver-textdocument';

import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true
      },
      // Tell the client that this server supports go to definition
      definitionProvider: true
    }
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// Twig parser and utilities
interface TwigTemplate {
  extends?: string;
  includes: string[];
  blocks: { [name: string]: Range };
  variables: { [name: string]: Range[] };
}

class TwigParser {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  parse(document: TextDocument): TwigTemplate {
    const text = document.getText();
    const template: TwigTemplate = {
      includes: [],
      blocks: {},
      variables: {}
    };

    // Parse extends statements
    const extendsRegex = /\{%\s*extends\s+['""]([^'"]*)['"]\s*%\}/g;
    let match;
    while ((match = extendsRegex.exec(text)) !== null) {
      template.extends = match[1];
    }

    // Parse include statements
    const includeRegex = /\{%\s*include\s+['""]([^'"]*)['"]/g;
    while ((match = includeRegex.exec(text)) !== null) {
      template.includes.push(match[1]);
    }

    // Parse block definitions
    const blockRegex = /\{%\s*block\s+(\w+)\s*%\}/g;
    while ((match = blockRegex.exec(text)) !== null) {
      const position = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);
      template.blocks[match[1]] = Range.create(position, endPosition);
    }

    // Parse variable references
    const variableRegex = /\{\{\s*(\w+)/g;
    while ((match = variableRegex.exec(text)) !== null) {
      const varName = match[1];
      const position = document.positionAt(match.index + match[0].indexOf(varName));
      const endPosition = document.positionAt(match.index + match[0].indexOf(varName) + varName.length);

      if (!template.variables[varName]) {
        template.variables[varName] = [];
      }
      template.variables[varName].push(Range.create(position, endPosition));
    }

    return template;
  }

  resolveTemplatePath(templateName: string, currentDocumentUri: string): string | null {
    try {
      const currentDir = path.dirname(URI.parse(currentDocumentUri).fsPath);

      // Try different common Twig template paths
      const possiblePaths = [
        path.resolve(currentDir, templateName),
        path.resolve(this.workspaceRoot, 'templates', templateName),
        path.resolve(this.workspaceRoot, 'views', templateName),
        path.resolve(this.workspaceRoot, 'src/templates', templateName),
        path.resolve(this.workspaceRoot, 'app/Resources/views', templateName),
      ];

      // Add .twig extension if not present
      const pathsWithExtension = possiblePaths.flatMap(p => [
        p,
        p.endsWith('.twig') ? p : p + '.twig',
        p.endsWith('.html.twig') ? p : p + '.html.twig'
      ]);

      for (const templatePath of pathsWithExtension) {
        if (fs.existsSync(templatePath)) {
          return templatePath;
        }
      }
    } catch (error) {
      connection.console.error(`Error resolving template path: ${error}`);
    }
    return null;
  }
}

let parser: TwigParser;

// Initialize parser when workspace folders are available
connection.onInitialized(() => {
  connection.workspace.getWorkspaceFolders().then(folders => {
    if (folders && folders.length > 0) {
      const workspaceRoot = URI.parse(folders[0].uri).fsPath;
      parser = new TwigParser(workspaceRoot);
    }
  });
});

// Go to Definition handler
connection.onDefinition((params: TextDocumentPositionParams): Definition | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !parser) {
    return null;
  }

  const text = document.getText();
  const offset = document.offsetAt(params.position);

  // Check if we're in an extends statement
  const extendsRegex = /\{%\s*extends\s+['""]([^'"]*)['"]\s*%\}/g;
  let match;
  while ((match = extendsRegex.exec(text)) !== null) {
    const start = match.index + match[0].indexOf(match[1]);
    const end = start + match[1].length;

    if (offset >= start && offset <= end) {
      const templatePath = parser.resolveTemplatePath(match[1], document.uri);
      if (templatePath) {
        return Location.create(
          URI.file(templatePath).toString(),
          Range.create(Position.create(0, 0), Position.create(0, 0))
        );
      }
    }
  }

  // Check if we're in an include statement
  const includeRegex = /\{%\s*include\s+['""]([^'"]*)['"]/g;
  while ((match = includeRegex.exec(text)) !== null) {
    const start = match.index + match[0].indexOf(match[1]);
    const end = start + match[1].length;

    if (offset >= start && offset <= end) {
      const templatePath = parser.resolveTemplatePath(match[1], document.uri);
      if (templatePath) {
        return Location.create(
          URI.file(templatePath).toString(),
          Range.create(Position.create(0, 0), Position.create(0, 0))
        );
      }
    }
  }

  // Check if we're in a block reference
  const blockRegex = /\{%\s*block\s+(\w+)\s*%\}/g;
  while ((match = blockRegex.exec(text)) !== null) {
    const start = match.index + match[0].indexOf(match[1]);
    const end = start + match[1].length;

    if (offset >= start && offset <= end) {
      const blockName = match[1];
      const template = parser.parse(document);

      // If this template extends another, look for the block in the parent
      if (template.extends) {
        const parentPath = parser.resolveTemplatePath(template.extends, document.uri);
        if (parentPath) {
          try {
            const parentContent = fs.readFileSync(parentPath, 'utf8');
            const parentDoc = TextDocument.create(
              URI.file(parentPath).toString(),
              'twig',
              1,
              parentContent
            );
            const parentTemplate = parser.parse(parentDoc);

            if (parentTemplate.blocks[blockName]) {
              return Location.create(
                URI.file(parentPath).toString(),
                parentTemplate.blocks[blockName]
              );
            }
          } catch (error) {
            connection.console.error(`Error reading parent template: ${error}`);
          }
        }
      }
    }
  }

  return null;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
