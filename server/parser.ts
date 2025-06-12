import { TextDocument } from 'vscode-languageserver-textdocument';
import { Range, Position, Location } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';
import { TwigTemplate, TwigMatch } from './types';
import { globalSettings } from './config';

export class TwigParser {
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

      for (const templatePath of pathsWithExtension) {
        if (fs.existsSync(templatePath)) {
          return templatePath;
        }
      }
    } catch (error) {
      console.error(`Error resolving template path: ${error}`);
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
      console.error(`Error reading template ${templatePath}: ${error}`);
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
      console.error(`Error reading template ${templatePath}: ${error}`);
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
        console.error(`Error reading template ${templatePath}: ${error}`);
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
