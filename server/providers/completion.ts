import { TextDocumentPositionParams, CompletionItem, CompletionItemKind, MarkupKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as path from 'path';
import { TwigParser } from '../parser';
import { globalSettings } from '../config';
import { fuzzyMatch } from '../utils';

export function handleCompletion(
  params: TextDocumentPositionParams,
  documents: Map<string, TextDocument> | { get(uri: string): TextDocument | undefined },
  parser: TwigParser,
  connection: any
): CompletionItem[] {
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
      }

      // Enhanced filtering logic - match against filename, path components, and fuzzy matching
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
}
