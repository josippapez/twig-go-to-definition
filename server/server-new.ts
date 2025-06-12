import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  TextDocumentPositionParams,
  ReferenceParams,
  DocumentSymbolParams
} from 'vscode-languageserver/node';

import {
  TextDocument
} from 'vscode-languageserver-textdocument';

import { URI } from 'vscode-uri';

// Import our modular components
import { TwigParser } from './parser';
import { updateConfiguration } from './config';
import { handleGoToDefinition } from './providers/definition';
import { handleHover } from './providers/hover';
import { handleCompletion } from './providers/completion';
import { handleDocumentSymbol } from './providers/symbols';
import { handleFindReferences } from './providers/references';
import { validateTwigDocument } from './providers/diagnostics';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let parser: TwigParser;

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
        resolveProvider: true,
        triggerCharacters: ['{', '%', '"', "'"]
      },
      // Tell the client that this server supports go to definition
      definitionProvider: true,
      // Tell the client that this server supports hover
      hoverProvider: true,
      // Tell the client that this server supports find references
      referencesProvider: true,
      // Tell the client that this server supports document symbols
      documentSymbolProvider: true
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

  // Load initial configuration
  if (hasConfigurationCapability) {
    updateConfiguration(connection, hasConfigurationCapability);
  }

  // Initialize parser when workspace folders are available
  connection.workspace.getWorkspaceFolders().then(folders => {
    if (folders && folders.length > 0) {
      const workspaceRoot = URI.parse(folders[0].uri).fsPath;
      parser = new TwigParser(workspaceRoot);
      connection.console.log(`Twig parser initialized with workspace root: ${workspaceRoot}`);
    } else {
      connection.console.log('No workspace folders found');
    }
  });
});

// Configuration change handler
connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    updateConfiguration(connection, hasConfigurationCapability);
  }
});

// Go to Definition handler
connection.onDefinition((params: TextDocumentPositionParams) => {
  return handleGoToDefinition(params, documents, parser, connection);
});

// Hover handler
connection.onHover((params: TextDocumentPositionParams) => {
  return handleHover(params, documents, parser);
});

// Completion handler
connection.onCompletion((params: TextDocumentPositionParams) => {
  return handleCompletion(params, documents, parser, connection);
});

// Document Symbol handler
connection.onDocumentSymbol((params: DocumentSymbolParams) => {
  return handleDocumentSymbol(params, documents, parser, connection);
});

// Find References handler
connection.onReferences((params: ReferenceParams) => {
  return handleFindReferences(params, documents, parser, connection);
});

// Document validation
async function validateDocument(textDocument: TextDocument): Promise<void> {
  if (!parser) {
    return;
  }

  const diagnostics = await validateTwigDocument(textDocument, parser, connection);
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Listen for document changes and validate
documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

documents.onDidOpen(change => {
  validateDocument(change.document);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
