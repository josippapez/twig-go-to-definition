<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Twig Go to Definition Extension

This is a VS Code extension project that provides Go to Definition functionality for Twig template files using the Language Server Protocol. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Structure
- Language Server: Provides Twig parsing and Go to Definition functionality
- Client Extension: VS Code extension that communicates with the language server
- Supports Twig template includes, extends, blocks, and variable references

## Key Technologies
- TypeScript
- VS Code Language Server Protocol
- vscode-languageserver-node
- vscode-languageclient

## Twig Features to Support
- `{% include %}` statements
- `{% extends %}` statements
- `{% block %}` definitions and usages
- Variable references
- Template file resolution
