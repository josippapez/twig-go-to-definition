import { TextDocumentPositionParams, Hover, MarkupKind, MarkupContent } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TwigParser } from '../parser';
import { getTemplatePreview } from '../utils';

export function handleHover(
  params: TextDocumentPositionParams,
  documents: Map<string, TextDocument> | { get(uri: string): TextDocument | undefined },
  parser: TwigParser
): Hover | null {
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
}
