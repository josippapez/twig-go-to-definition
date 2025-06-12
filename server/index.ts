// Main exports for the Twig Language Server
export { TwigParser } from './parser';
export { updateConfiguration, globalSettings, defaultSettings } from './config';
export { TwigGoToDefinitionSettings, TwigTemplate, TwigMatch } from './types';
export { fuzzyMatch, escapeRegex, getTemplatePreview } from './utils';

// Provider exports
export { handleGoToDefinition } from './providers/definition';
export { handleHover } from './providers/hover';
export { handleCompletion } from './providers/completion';
export { handleDocumentSymbol } from './providers/symbols';
export { handleFindReferences } from './providers/references';
export { validateTwigDocument } from './providers/diagnostics';
