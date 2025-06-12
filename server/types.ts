import { Range } from 'vscode-languageserver/node';

export interface TwigGoToDefinitionSettings {
  pathResolution: 'smart' | 'absolute' | 'relative';
  templateDirectories: string[];
  diagnostics: {
    enabled: boolean;
  };
}

export interface TwigTemplate {
  extends?: string;
  includes: string[];
  blocks: { [name: string]: Range };
  variables: { [name: string]: Range[] };
  blockReferences: { [name: string]: Range[] };
  parentCalls: Range[]; // For {{ parent() }} calls
}

export interface TwigMatch {
  type: 'extends' | 'include' | 'block' | 'block_reference' | 'variable' | 'parent_call';
  name: string;
  range: Range;
  templateName?: string;
  blockName?: string; // For parent calls within blocks
}
