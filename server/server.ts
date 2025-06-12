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
  Position,
  Hover,
  MarkupKind,
  MarkupContent,
  ReferenceParams,
  DocumentSymbolParams,
  DocumentSymbol,
  SymbolKind,
  TextEdit
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
    updateConfiguration();
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
    updateConfiguration();
  }
});

async function updateConfiguration() {
  try {
    const settings = await connection.workspace.getConfiguration('twigGoToDefinition');
    globalSettings = {
      pathResolution: settings.pathResolution || 'smart',
      templateDirectories: settings.templateDirectories || ['templates', 'views', 'src/templates', 'examples'],
      diagnostics: {
        enabled: settings.diagnostics?.enabled !== false
      }
    };
    connection.console.log(`Configuration updated: pathResolution=${globalSettings.pathResolution}`);
  } catch (error) {
    connection.console.error(`Error updating configuration: ${error}`);
    globalSettings = defaultSettings;
  }
}

// Configuration interface
interface TwigGoToDefinitionSettings {
  pathResolution: 'smart' | 'absolute' | 'relative';
  templateDirectories: string[];
  diagnostics: {
    enabled: boolean;
  };
}

// Default settings
const defaultSettings: TwigGoToDefinitionSettings = {
  pathResolution: 'smart',
  templateDirectories: ['templates', 'views', 'src/templates', 'examples'],
  diagnostics: { enabled: true }
};

let globalSettings: TwigGoToDefinitionSettings = defaultSettings;

// Twig parser and utilities
interface TwigTemplate {
  extends?: string;
  includes: string[];
  blocks: { [name: string]: Range };
  variables: { [name: string]: Range[] };
  blockReferences: { [name: string]: Range[] };
  parentCalls: Range[]; // For {{ parent() }} calls
}

interface TwigMatch {
  type: 'extends' | 'include' | 'block' | 'block_reference' | 'variable' | 'parent_call';
  name: string;
  range: Range;
  templateName?: string;
  blockName?: string; // For parent calls within blocks
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
      variables: {},
      blockReferences: {},
      parentCalls: []
    };

    // Parse extends statements
    const extendsRegex = /\{%\s*extends\s+['"]([^'"]*)['"]\s*%\}/g;
    let match;
    while ((match = extendsRegex.exec(text)) !== null) {
      template.extends = match[1];
    }

    // Parse include statements - support both basic includes and includes with variables
    const includeRegex = /\{%\s*include\s+['"]([^'"]*)['"]/g;
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

    // Parse parent() calls
    const parentRegex = /\{\{\s*parent\(\)\s*\}\}/g;
    while ((match = parentRegex.exec(text)) !== null) {
      const position = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);
      template.parentCalls.push(Range.create(position, endPosition));
    }

    // Parse block() function references
    const blockFuncRegex = /\{\{\s*block\(\s*['"](\w+)['"]\s*\)\s*\}\}/g;
    while ((match = blockFuncRegex.exec(text)) !== null) {
      const blockName = match[1];
      const position = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);

      if (!template.blockReferences[blockName]) {
        template.blockReferences[blockName] = [];
      }
      template.blockReferences[blockName].push(Range.create(position, endPosition));
    }

    // Parse variable references - improved to handle more complex patterns
    const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*(?:\[[^\]]*\])*)/g;
    while ((match = variableRegex.exec(text)) !== null) {
      const varName = match[1].split('.')[0]; // Get the root variable name
      const position = document.positionAt(match.index + match[0].indexOf(match[1]));
      const endPosition = document.positionAt(match.index + match[0].indexOf(match[1]) + varName.length);

      if (!template.variables[varName]) {
        template.variables[varName] = [];
      }
      template.variables[varName].push(Range.create(position, endPosition));
    }

    // Also parse variables in for loops and set statements
    const forVarRegex = /\{%\s*for\s+(\w+)(?:\s*,\s*(\w+))?\s+in\s+/g;
    while ((match = forVarRegex.exec(text)) !== null) {
      // Add loop variables
      const vars = [match[1]];
      if (match[2]) {
        vars.push(match[2]);
      }

      for (const varName of vars) {
        const position = document.positionAt(match.index + match[0].indexOf(varName));
        const endPosition = document.positionAt(match.index + match[0].indexOf(varName) + varName.length);

        if (!template.variables[varName]) {
          template.variables[varName] = [];
        }
        template.variables[varName].push(Range.create(position, endPosition));
      }
    }

    // Parse set statements
    const setVarRegex = /\{%\s*set\s+(\w+)/g;
    while ((match = setVarRegex.exec(text)) !== null) {
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

  findTwigMatchAtPosition(document: TextDocument, position: Position): TwigMatch | null {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Check extends statements
    const extendsRegex = /\{%\s*extends\s+['"]([^'"]*)['"]\s*%\}/g;
    let match;
    while ((match = extendsRegex.exec(text)) !== null) {
      const start = match.index + match[0].indexOf(match[1]);
      const end = start + match[1].length;

      if (offset >= start && offset <= end) {
        return {
          type: 'extends',
          name: match[1],
          templateName: match[1],
          range: Range.create(
            document.positionAt(start),
            document.positionAt(end)
          )
        };
      }
    }

    // Check include statements
    const includeRegex = /\{%\s*include\s+['"]([^'"]*)['"]/g;
    while ((match = includeRegex.exec(text)) !== null) {
      const start = match.index + match[0].indexOf(match[1]);
      const end = start + match[1].length;

      if (offset >= start && offset <= end) {
        return {
          type: 'include',
          name: match[1],
          templateName: match[1],
          range: Range.create(
            document.positionAt(start),
            document.positionAt(end)
          )
        };
      }
    }

    // Check parent() calls
    const parentRegex = /\{\{\s*parent\(\)\s*\}\}/g;
    while ((match = parentRegex.exec(text)) !== null) {
      if (offset >= match.index && offset <= match.index + match[0].length) {
        // Find which block this parent() call is in
        const blockName = this.findCurrentBlock(text, match.index);
        return {
          type: 'parent_call',
          name: 'parent',
          blockName: blockName || undefined,
          range: Range.create(
            document.positionAt(match.index),
            document.positionAt(match.index + match[0].length)
          )
        };
      }
    }

    // Check block() function references
    const blockFuncRegex = /\{\{\s*block\(\s*['"](\w+)['"]\s*\)\s*\}\}/g;
    while ((match = blockFuncRegex.exec(text)) !== null) {
      const start = match.index + match[0].indexOf(match[1]);
      const end = start + match[1].length;

      if (offset >= start && offset <= end) {
        return {
          type: 'block_reference',
          name: match[1],
          range: Range.create(
            document.positionAt(start),
            document.positionAt(end)
          )
        };
      }
    }

    // Check block definitions
    const blockRegex = /\{%\s*block\s+(\w+)\s*%\}/g;
    while ((match = blockRegex.exec(text)) !== null) {
      const start = match.index + match[0].indexOf(match[1]);
      const end = start + match[1].length;

      if (offset >= start && offset <= end) {
        return {
          type: 'block',
          name: match[1],
          range: Range.create(
            document.positionAt(start),
            document.positionAt(end)
          )
        };
      }
    }

    // Check variable references
    const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]*)*)/g;
    while ((match = variableRegex.exec(text)) !== null) {
      const start = match.index + match[0].indexOf(match[1]);
      const end = start + match[1].length;

      if (offset >= start && offset <= end) {
        return {
          type: 'variable',
          name: match[1],
          range: Range.create(
            document.positionAt(start),
            document.positionAt(end)
          )
        };
      }
    }

    return null;
  }

  // Helper method to find which block a position is within
  private findCurrentBlock(text: string, position: number): string | null {
    const blockStartRegex = /\{%\s*block\s+(\w+)\s*%\}/g;
    const blockEndRegex = /\{%\s*endblock\s*(?:\w+\s*)?%\}/g;

    let lastBlockName: string | null = null;
    let lastBlockStart = -1;
    let match;

    // Find all block starts before the position
    while ((match = blockStartRegex.exec(text)) !== null) {
      if (match.index < position) {
        lastBlockName = match[1];
        lastBlockStart = match.index;
      } else {
        break;
      }
    }

    // Check if there's an endblock between the last block start and the position
    if (lastBlockStart !== -1) {
      blockEndRegex.lastIndex = lastBlockStart;
      const endMatch = blockEndRegex.exec(text);
      if (endMatch && endMatch.index < position) {
        return null; // Position is after the block end
      }
      return lastBlockName;
    }

    return null;
  }

  resolveTemplatePath(templateName: string, currentDocumentUri: string): string | null {
    try {
      const currentDir = path.dirname(URI.parse(currentDocumentUri).fsPath);
      connection.console.log(`Resolving template: "${templateName}" from: ${currentDocumentUri}`);

      // Try different common Twig template paths
      const possiblePaths = [
        // Relative to current file - this is important for same-directory includes
        path.resolve(currentDir, templateName),
        // If templateName contains a path like "components/file.twig", try relative to workspace root
        path.resolve(this.workspaceRoot, templateName),
        // Try from examples directory (for our test case)
        path.resolve(this.workspaceRoot, 'examples', templateName),
        // Common Twig template directories
        path.resolve(this.workspaceRoot, 'templates', templateName),
        path.resolve(this.workspaceRoot, 'views', templateName),
        path.resolve(this.workspaceRoot, 'src/templates', templateName),
        path.resolve(this.workspaceRoot, 'app/Resources/views', templateName),
        // Additional common patterns
        path.resolve(this.workspaceRoot, 'public/templates', templateName),
        path.resolve(this.workspaceRoot, 'web/templates', templateName),
        path.resolve(this.workspaceRoot, 'assets/templates', templateName),
      ];

      // For paths starting with "components/", also try relative to parent directory
      if (templateName.startsWith('components/')) {
        const parentDir = path.dirname(currentDir);
        possiblePaths.unshift(path.resolve(parentDir, templateName));

        // Also try without the "components/" prefix if we're already in components directory
        if (currentDir.endsWith('components')) {
          const justFilename = templateName.replace('components/', '');
          possiblePaths.unshift(path.resolve(currentDir, justFilename));
        }
      }

      // Add file extensions if not present
      const pathsWithExtension = possiblePaths.flatMap(p => {
        const variants = [p];
        if (!p.endsWith('.twig') && !p.endsWith('.html.twig')) {
          variants.push(p + '.twig');
          variants.push(p + '.html.twig');
        }
        return variants;
      });

      connection.console.log(`Trying paths: ${pathsWithExtension.slice(0, 5).join(', ')}...`);

      for (const templatePath of pathsWithExtension) {
        if (fs.existsSync(templatePath)) {
          connection.console.log(`Found template at: ${templatePath}`);
          return templatePath;
        }
      }

      connection.console.log(`Template "${templateName}" not found in any of the ${pathsWithExtension.length} possible paths`);
    } catch (error) {
      connection.console.error(`Error resolving template path: ${error}`);
    }
    return null;
  }

  findBlockInTemplate(templatePath: string, blockName: string): Range | null {
    try {
      const content = fs.readFileSync(templatePath, 'utf8');
      const doc = TextDocument.create(
        URI.file(templatePath).toString(),
        'twig',
        1,
        content
      );
      const template = this.parse(doc);
      return template.blocks[blockName] || null;
    } catch (error) {
      connection.console.error(`Error reading template ${templatePath}: ${error}`);
      return null;
    }
  }

  getAllTemplateFiles(): string[] {
    const templates: string[] = [];

    // Use configured template directories
    const configuredDirs = globalSettings.templateDirectories.map(dir =>
      path.join(this.workspaceRoot, dir)
    );

    const searchDirs = [
      ...configuredDirs,
      // Always include workspace root
      this.workspaceRoot
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.findTwigFiles(dir, templates);
      }
    }

    return templates;
  }

  private findTwigFiles(dir: string, templates: string[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.findTwigFiles(fullPath, templates);
        } else if (entry.name.endsWith('.twig') || entry.name.endsWith('.html.twig')) {
          templates.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors when reading directories
    }
  }

  findBlockDefinition(blockName: string, document: TextDocument): Location | null {
    const template = this.parse(document);

    // First check if the block is defined in the current template
    if (template.blocks[blockName]) {
      return Location.create(
        document.uri,
        template.blocks[blockName]
      );
    }

    // Then check parent templates
    if (template.extends) {
      const parentPath = this.resolveTemplatePath(template.extends, document.uri);
      if (parentPath) {
        const blockRange = this.findBlockInTemplate(parentPath, blockName);
        if (blockRange) {
          return Location.create(
            URI.file(parentPath).toString(),
            blockRange
          );
        }
      }
    }

    return null;
  }

  findVariableDefinition(variableName: string, document: TextDocument): Location | null {
    const template = this.parse(document);

    // Check if variable is defined in current template (set statements, for loops)
    if (template.variables[variableName] && template.variables[variableName].length > 0) {
      // Return the first definition
      return Location.create(
        document.uri,
        template.variables[variableName][0]
      );
    }

    // For now, we don't have a way to trace variables across templates
    // This would require more complex analysis of the template context
    return null;
  }

  // Helper method to search for blocks in inheritance chain
  private findBlockInInheritanceChain(blockName: string, templatePath: string, visited: Set<string> = new Set()): { path: string; range: Range } | null {
    if (visited.has(templatePath)) {
      return null; // Prevent infinite recursion
    }
    visited.add(templatePath);

    try {
      const content = fs.readFileSync(templatePath, 'utf8');
      const doc = TextDocument.create(
        URI.file(templatePath).toString(),
        'twig',
        1,
        content
      );
      const template = this.parse(doc);

      // Check if block exists in this template
      if (template.blocks[blockName]) {
        return { path: templatePath, range: template.blocks[blockName] };
      }

      // Check parent template
      if (template.extends) {
        const parentPath = this.resolveTemplatePath(template.extends, URI.file(templatePath).toString());
        if (parentPath) {
          return this.findBlockInInheritanceChain(blockName, parentPath, visited);
        }
      }
    } catch (error) {
      connection.console.error(`Error reading template ${templatePath}: ${error}`);
    }

    return null;
  }

  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  getBlocksFromParentTemplates(templateName: string, currentDocumentUri: string): string[] {
    const blocks: string[] = [];
    const visited = new Set<string>();
    let currentTemplate: string | undefined = templateName;

    while (currentTemplate && !visited.has(currentTemplate)) {
      visited.add(currentTemplate);

      const templatePath = this.resolveTemplatePath(currentTemplate, currentDocumentUri);
      if (!templatePath) {
        break;
      }

      try {
        const content = fs.readFileSync(templatePath, 'utf8');
        const doc = TextDocument.create(
          URI.file(templatePath).toString(),
          'twig',
          1,
          content
        );
        const template = this.parse(doc);

        // Add all blocks from this template
        Object.keys(template.blocks).forEach(blockName => {
          if (!blocks.includes(blockName)) {
            blocks.push(blockName);
          }
        });

        currentTemplate = template.extends;
      } catch (error) {
        connection.console.error(`Error reading template ${templatePath}: ${error}`);
        break;
      }
    }

    return blocks;
  }

  // Completion support
  getAllTemplateNames(): string[] {
    const templates: string[] = [];
    const searchDirs = [
      path.join(this.workspaceRoot, 'templates'),
      path.join(this.workspaceRoot, 'views'),
      path.join(this.workspaceRoot, 'src/templates'),
      path.join(this.workspaceRoot, 'app/Resources/views'),
      path.join(this.workspaceRoot, 'public/templates'),
      path.join(this.workspaceRoot, 'web/templates'),
      path.join(this.workspaceRoot, 'assets/templates'),
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.findTwigFiles(dir, templates);
      }
    }

    return templates.map(t => path.basename(t, path.extname(t)));
  }
}

// Helper function to read template content and metadata for hover previews
function getTemplatePreview(templatePath: string): { content: string; metadata: string } | null {
  try {
    // Check if file exists and get stats
    const stats = fs.statSync(templatePath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);
    const lastModified = stats.mtime.toLocaleDateString();

    // Don't read very large files (over 100KB)
    if (stats.size > 100 * 1024) {
      return {
        content: '*File too large to preview*',
        metadata: `**Size**: ${fileSizeKB} KB | **Modified**: ${lastModified}`
      };
    }

    // Read file content
    const content = fs.readFileSync(templatePath, 'utf-8');

    // Get first few lines for preview (max 10 lines or 500 characters)
    const lines = content.split('\n');
    const previewLines = lines.slice(0, 10);
    let preview = previewLines.join('\n');

    // Truncate if too long
    if (preview.length > 500) {
      preview = preview.substring(0, 500) + '...';
    }

    // Add "..." if there are more lines
    if (lines.length > 10) {
      preview += '\n...';
    }

    return {
      content: preview,
      metadata: `**Size**: ${fileSizeKB} KB | **Lines**: ${lines.length} | **Modified**: ${lastModified}`
    };
  } catch (error) {
    return {
      content: '*Could not read file*',
      metadata: '*File information unavailable*'
    };
  }
}

let parser: TwigParser;

// Fuzzy matching utility function
function fuzzyMatch(text: string, pattern: string): boolean {
  if (pattern === '') {
    return true;
  }

  const textLower = text.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Simple fuzzy matching: check if pattern characters appear in order
  let patternIndex = 0;
  for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIndex]) {
      patternIndex++;
    }
  }

  return patternIndex === patternLower.length;
}

// Go to Definition handler
connection.onDefinition((params: TextDocumentPositionParams): Definition | null => {
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
});

// Hover handler - provides information about Twig elements
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !parser) {
    return null;
  }

  const twigMatch = parser.findTwigMatchAtPosition(document, params.position);
  if (!twigMatch) {
    return null;
  }

  let hoverContent: MarkupContent | null = null;

  switch (twigMatch.type) {
    case 'extends':
      const extendsPath = parser.resolveTemplatePath(twigMatch.name, document.uri);
      let extendsContent = `**Extends Template**: \`${twigMatch.name}\`\n\n` +
                          `Inherits from parent template.\n\n`;

      if (extendsPath) {
        extendsContent += `**Resolved Path**: \`${extendsPath}\`\n\n`;

        // Add template preview
        const preview = getTemplatePreview(extendsPath);
        if (preview) {
          extendsContent += `**Template Preview:**\n\`\`\`twig\n${preview.content}\n\`\`\`\n\n`;
          extendsContent += preview.metadata;
        }
      } else {
        extendsContent += '**Path not found**';
      }

      hoverContent = {
        kind: MarkupKind.Markdown,
        value: extendsContent
      };
      break;

    case 'include':
      const includePath = parser.resolveTemplatePath(twigMatch.name, document.uri);
      let includeContent = `**Include Template**: \`${twigMatch.name}\`\n\n` +
                          `Includes the content of another template.\n\n`;

      if (includePath) {
        includeContent += `**Resolved Path**: \`${includePath}\`\n\n`;

        // Add template preview
        const preview = getTemplatePreview(includePath);
        if (preview) {
          includeContent += `**Template Preview:**\n\`\`\`twig\n${preview.content}\n\`\`\`\n\n`;
          includeContent += preview.metadata;
        }
      } else {
        includeContent += '**Path not found**';
      }

      hoverContent = {
        kind: MarkupKind.Markdown,
        value: includeContent
      };
      break;

    case 'block':
      const template = parser.parse(document);
      let blockInfo = `**Block**: \`${twigMatch.name}\`\n\n` +
                     `Defines a block that can be overridden in child templates.`;

      if (template.extends) {
        const parentPath = parser.resolveTemplatePath(template.extends, document.uri);
        if (parentPath) {
          const parentBlockRange = parser.findBlockInTemplate(parentPath, twigMatch.name);
          if (parentBlockRange) {
            blockInfo += `\n\n**Overrides block in**: \`${template.extends}\``;
          }
        }
      }

      hoverContent = {
        kind: MarkupKind.Markdown,
        value: blockInfo
      };
      break;

    case 'block_reference':
      hoverContent = {
        kind: MarkupKind.Markdown,
        value: `**Block Reference**: \`${twigMatch.name}\`\n\n` +
               `References a block defined in this template or parent templates.`
      };
      break;

    case 'parent_call':
      hoverContent = {
        kind: MarkupKind.Markdown,
        value: `**Parent Call**\n\n` +
               `Calls the parent template's version of the current block.\n\n` +
               (twigMatch.blockName ? `**Current Block**: \`${twigMatch.blockName}\`` : '')
      };
      break;

    case 'variable':
      const varTemplate = parser.parse(document);
      let varInfo = `**Variable**: \`${twigMatch.name}\`\n\n`;

      if (varTemplate.variables[twigMatch.name]) {
        const occurrences = varTemplate.variables[twigMatch.name].length;
        varInfo += `**Occurrences in template**: ${occurrences}`;
      }

      hoverContent = {
        kind: MarkupKind.Markdown,
        value: varInfo
      };
      break;
  }

  if (hoverContent) {
    return {
      contents: hoverContent,
      range: twigMatch.range
    };
  }

  return null;
});

// Completion handler - provides auto-completion for templates and blocks
connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document || !parser) {
    connection.console.log('Completion: Document or parser not available');
    return [];
  }

  const text = document.getText();
  const offset = document.offsetAt(params.position);
  const lineText = text.split('\n')[params.position.line];
  const beforeCursor = lineText.substring(0, params.position.character);

  connection.console.log(`Completion request at ${params.position.line}:${params.position.character}, beforeCursor: "${beforeCursor}"`);

  const completions: CompletionItem[] = [];

  // Template completion for extends and include statements
  const templateMatch = beforeCursor.match(/\{%\s*(?:extends|include)\s+['"]([^'"]*)$/);
  if (templateMatch) {
    connection.console.log('Detected template completion context');
    const partialInput = templateMatch[1]; // Get the partial input (preserve case for replacement)
    const partialInputLower = partialInput.toLowerCase(); // For filtering
    const templates = parser.getAllTemplateFiles();
    connection.console.log(`Found ${templates.length} template files, filtering by: "${partialInput}"`);

    const workspaceRoot = parser.getWorkspaceRoot();
    const currentDir = path.dirname(URI.parse(document.uri).fsPath);

    // Find the top-level directory of the current file (relative to workspace)
    const currentRelativeDir = path.relative(workspaceRoot, currentDir);
    const currentTopLevel = currentRelativeDir.split(path.sep)[0] || '';

    connection.console.log(`Current relative dir: ${currentRelativeDir}, top level: ${currentTopLevel}`);

    for (const templatePath of templates) {
      const templateDir = path.dirname(templatePath);
      const templateRelativeDir = path.relative(workspaceRoot, templateDir);
      const templateTopLevel = templateRelativeDir.split(path.sep)[0] || '';
      const filename = path.basename(templatePath);

      connection.console.log(`Processing template: ${templatePath}`);
      connection.console.log(`  Template dir: ${templateDir}, relative: ${templateRelativeDir}, top level: ${templateTopLevel}`);

      let suggestion: string;
      let detail: string;
      let sortText: string;

      if (globalSettings.pathResolution === 'absolute') {
        // Always use path from workspace root
        const absolutePath = path.relative(workspaceRoot, templatePath).replace(/\\/g, '/');
        suggestion = absolutePath;
        detail = `Twig Template (${templateTopLevel || 'root'})`;
        sortText = templateDir === currentDir ? '1' + suggestion : '2' + suggestion;
      } else if (globalSettings.pathResolution === 'relative') {
        // Always use relative path from current file
        const relativePath = path.relative(currentDir, templatePath).replace(/\\/g, '/');
        suggestion = relativePath;
        detail = 'Twig Template (relative)';
        sortText = templateDir === currentDir ? '1' + suggestion : '2' + suggestion;
      } else {
        // Smart path resolution (default behavior)
        if (templateDir === currentDir) {
          // Same directory - just use filename
          suggestion = filename;
          detail = 'Twig Template (same directory)';
          sortText = '1' + suggestion;
        } else if (currentTopLevel && templateTopLevel === currentTopLevel) {
          // Same top-level directory but different subdirectory
          const relativePath = path.relative(currentDir, templatePath).replace(/\\/g, '/');
          suggestion = relativePath;
          detail = `Twig Template (${templateTopLevel})`;
          sortText = '2' + suggestion;
        } else if (templateTopLevel) {
          // Different top-level directory - use path from top-level
          const fromTopLevel = path.relative(workspaceRoot, templatePath).replace(/\\/g, '/');
          suggestion = fromTopLevel;
          detail = `Twig Template (${templateTopLevel})`;
          sortText = '3' + suggestion;
        } else {
          // Files in workspace root
          suggestion = filename;
          detail = 'Twig Template (root)';
          sortText = '1' + suggestion;
        }
      }      // Enhanced filtering logic - match against filename, path components, and fuzzy matching
      const baseFilename = path.basename(filename, '.twig'); // Remove .twig extension
      const pathComponents = suggestion.split('/'); // Split path into components

      let shouldInclude = false;
      let matchScore = 0;

      if (partialInput === '') {
        // Show all templates when no input
        shouldInclude = true;
        matchScore = 50;
      } else {
        // Check various matching strategies
        const filenameLower = filename.toLowerCase();
        const baseFilenameLower = baseFilename.toLowerCase();
        const suggestionLower = suggestion.toLowerCase();

        // 1. Exact filename match (highest priority)
        if (baseFilenameLower === partialInputLower || filenameLower === partialInputLower) {
          shouldInclude = true;
          matchScore = 100;
        }
        // 2. Filename starts with input
        else if (baseFilenameLower.startsWith(partialInputLower) || filenameLower.startsWith(partialInputLower)) {
          shouldInclude = true;
          matchScore = 95;
        }
        // 3. Filename contains input
        else if (baseFilenameLower.includes(partialInputLower) || filenameLower.includes(partialInputLower)) {
          shouldInclude = true;
          matchScore = 85;
        }
        // 4. Any path component matches
        else if (pathComponents.some(component => component.toLowerCase().includes(partialInputLower))) {
          shouldInclude = true;
          matchScore = 80;
        }
        // 5. Full path starts with input
        else if (suggestionLower.startsWith(partialInputLower)) {
          shouldInclude = true;
          matchScore = 75;
        }
        // 6. Full path contains input
        else if (suggestionLower.includes(partialInputLower)) {
          shouldInclude = true;
          matchScore = 70;
        }
        // 7. Fuzzy match on filename (more lenient)
        else if (fuzzyMatch(baseFilenameLower, partialInputLower) || fuzzyMatch(filenameLower, partialInputLower)) {
          shouldInclude = true;
          matchScore = 60;
        }
        // 8. Fuzzy match on full path
        else if (fuzzyMatch(suggestionLower, partialInputLower)) {
          shouldInclude = true;
          matchScore = 55;
        }
      }

      if (shouldInclude) {
        connection.console.log(`  Adding completion: ${suggestion} (score: ${matchScore}, filename: ${filename})`);
        completions.push({
          label: suggestion,
          kind: CompletionItemKind.File,
          detail: detail,
          documentation: {
            kind: MarkupKind.Markdown,
            value: `Template file: \`${templatePath}\``
          },
          insertText: suggestion,
          sortText: (100 - matchScore).toString().padStart(3, '0') + sortText, // Higher score = earlier in list
          filterText: suggestion + ' ' + filename + ' ' + baseFilename // Help with VS Code's built-in filtering
        });
      }
    }

    connection.console.log(`Generated ${completions.length} filtered template completions`);
  }

  // Block completion for block() function calls
  if (beforeCursor.match(/\{\{\s*block\(\s*['"][^'"]*$/)) {
    const template = parser.parse(document);
    const availableBlocks = new Set<string>();

    // Add blocks from current template
    Object.keys(template.blocks).forEach(blockName => {
      availableBlocks.add(blockName);
    });

    // Add blocks from parent templates
    if (template.extends) {
      const parentBlocks = parser.getBlocksFromParentTemplates(template.extends, document.uri);
      parentBlocks.forEach(blockName => availableBlocks.add(blockName));
    }

    availableBlocks.forEach(blockName => {
      completions.push({
        label: blockName,
        kind: CompletionItemKind.Property,
        detail: 'Twig Block',
        documentation: {
          kind: MarkupKind.Markdown,
          value: `Block: \`${blockName}\``
        },
        insertText: blockName
      });
    });
  }

  // Variable completion
  if (beforeCursor.match(/\{\{\s*[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    const template = parser.parse(document);
    const availableVars = new Set<string>();

    // Add variables from current template
    Object.keys(template.variables).forEach(varName => {
      availableVars.add(varName);
    });

    // Add common Twig global variables
    const globalVars = ['app', 'dump', '_context', '_charset', '_locale'];
    globalVars.forEach(varName => availableVars.add(varName));

    availableVars.forEach(varName => {
      completions.push({
        label: varName,
        kind: CompletionItemKind.Variable,
        detail: 'Twig Variable',
        insertText: varName
      });
    });
  }

  // Twig tag completion
  if (beforeCursor.match(/\{%\s*[a-zA-Z]*$/)) {
    const twigTags = [
      'block', 'endblock', 'extends', 'include', 'if', 'endif', 'else', 'elseif',
      'for', 'endfor', 'set', 'macro', 'endmacro', 'import', 'from', 'use',
      'filter', 'endfilter', 'spaceless', 'endspaceless', 'autoescape', 'endautoescape',
      'raw', 'endraw', 'verbatim', 'endverbatim', 'with', 'endwith'
    ];

    twigTags.forEach(tag => {
      completions.push({
        label: tag,
        kind: CompletionItemKind.Keyword,
        detail: 'Twig Tag',
        insertText: tag
      });
    });
  }

  connection.console.log(`Returning ${completions.length} completions`);
  return completions;
});

// Document Symbol Provider - provides outline view for templates
connection.onDocumentSymbol((params: DocumentSymbolParams): DocumentSymbol[] => {
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
  }  // Add blocks
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
  }  // Add variables
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
});

// Document validation - provides diagnostics for Twig templates
async function validateTwigDocument(textDocument: TextDocument): Promise<void> {
  if (!parser) {
    return;
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

  // Send diagnostics to the client
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Listen for document changes and validate
documents.onDidChangeContent(change => {
  validateTwigDocument(change.document);
});

documents.onDidOpen(change => {
  validateTwigDocument(change.document);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

// Find References handler - shows all usages of templates, blocks, and variables
connection.onReferences((params: ReferenceParams): Location[] => {
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
          references.push(...findTemplateReferences(twigMatch.templateName, templateUri));
        }
      }
      break;

    case 'block':
    case 'block_reference':
      // Find all places where this block is defined or referenced
      references.push(...findBlockReferences(twigMatch.name, document));
      break;

    case 'variable':
      // Find all places where this variable is used in the current template
      references.push(...findVariableReferences(twigMatch.name, document));
      break;
  }

  connection.console.log(`Found ${references.length} references`);
  return references;
});

function findTemplateReferences(templateName: string, templateUri: string): Location[] {
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

function findBlockReferences(blockName: string, document: TextDocument): Location[] {
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

function findVariableReferences(variableName: string, document: TextDocument): Location[] {
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

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
