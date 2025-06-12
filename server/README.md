# Twig Language Server Architecture

This directory contains the refactored Twig Language Server code, split into modular components for better maintainability.

## Architecture Overview

### Core Files

- **`server.ts`** - Main server entry point, handles connection and delegates to providers
- **`types.ts`** - TypeScript interfaces and type definitions
- **`config.ts`** - Configuration management and settings
- **`parser.ts`** - TwigParser class for parsing Twig templates
- **`utils.ts`** - Utility functions (fuzzy matching, template preview, etc.)
- **`index.ts`** - Main exports for the module

### Providers Directory

The `providers/` directory contains specialized handlers for different language server features:

- **`definition.ts`** - Go to Definition provider
- **`hover.ts`** - Hover information provider
- **`completion.ts`** - Auto-completion provider
- **`symbols.ts`** - Document symbols provider
- **`references.ts`** - Find references provider
- **`diagnostics.ts`** - Validation and diagnostics provider

## Key Benefits of This Architecture

1. **Separation of Concerns** - Each provider handles a specific language server feature
2. **Maintainability** - Smaller, focused files are easier to understand and modify
3. **Testability** - Individual components can be tested in isolation
4. **Reusability** - Providers can be reused or extended easily
5. **Type Safety** - Centralized type definitions ensure consistency

## Data Flow

1. **Server Initialization** (`server.ts`)
   - Creates connection and document manager
   - Initializes TwigParser with workspace root
   - Registers language server capabilities

2. **Request Handling**
   - Language server requests are received in `server.ts`
   - Delegated to appropriate provider in `providers/` directory
   - Providers use `TwigParser` and utility functions to process requests

3. **Configuration Management**
   - Settings are managed in `config.ts`
   - Global settings are accessible throughout the application

## Adding New Features

To add a new language server feature:

1. Create a new provider in `providers/` directory
2. Export the handler function from the provider
3. Import and register the handler in `server.ts`
4. Update `index.ts` if the provider should be exported

## Dependencies

- **vscode-languageserver/node** - Language Server Protocol implementation
- **vscode-languageserver-textdocument** - Text document management
- **vscode-uri** - URI utilities

## Original Metrics

- **Before Refactoring**: Single file with ~1,647 lines
- **After Refactoring**: 9 modular files with clear responsibilities
- **Functionality**: All original features preserved and working
