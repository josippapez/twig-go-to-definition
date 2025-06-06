# Twig Go to Definition

A VS Code extension that provides "Go to Definition" functionality for Twig template files using the Language Server Protocol.

## Features

This extension adds intelligent navigation support for Twig templates:

- **Template Navigation**: Click on template names in `{% extends %}` and `{% include %}` statements to jump to the referenced template file
- **Block Navigation**: Navigate from block references to their definitions in parent templates
- **Parent Call Navigation**: Navigate from `{{ parent() }}` calls to the parent template's block definition
- **Block Function Navigation**: Navigate from `{{ block('name') }}` calls to block definitions
- **Variable References**: Navigate to variable definitions within templates
- **Auto-completion**: Intelligent completion for template names, block names, variables, and Twig tags
- **Hover Information**: Detailed information about templates, blocks, and variables on hover
- **Diagnostics**: Real-time validation of template references and syntax
- **Automatic File Discovery**: Intelligent resolution of template paths across common Twig project structures

### Supported Twig Features

- `{% extends "template.twig" %}` - Navigate to parent template
- `{% include "partial.twig" %}` - Navigate to included template
- `{% block content %}` - Navigate to block definitions in parent templates
- `{{ parent() }}` - Navigate to parent template's block definition
- `{{ block('name') }}` - Navigate to block definitions
- Variable references in `{{ variable }}` syntax
- Variable definitions in `{% set %}` and `{% for %}` loops
- Template and block auto-completion
- Real-time error detection for missing templates and blocks

## Requirements

- VS Code 1.90.0 or higher
- Twig template files with `.twig` or `.html.twig` extensions

## Extension Settings

This extension contributes the following settings:

- Auto-detection of Twig files based on file extension
- Language support for `.twig` and `.html.twig` files
- Syntax highlighting for Twig templates

## Template Path Resolution

The extension automatically searches for templates in common Twig project directories:

- Relative to current file
- `templates/` directory
- `views/` directory
- `src/templates/` directory
- `app/Resources/views/` directory (Symfony)

## Known Issues

- Variable reference navigation is limited to local template scope
- Complex Twig expressions may not be fully supported
- Template path resolution may not work with highly customized directory structures
- Performance may be impacted with very large template hierarchies

## Release Notes

### 0.0.4

Enhanced implementation with comprehensive feature support:

- Added navigation for `{{ parent() }}` calls to parent template blocks
- Added navigation for `{{ block('name') }}` function calls
- Implemented variable reference navigation within templates
- Added intelligent auto-completion for templates, blocks, variables, and Twig tags
- Added hover information with detailed context
- Added real-time diagnostics for template validation
- Improved template path resolution with better error handling
- Enhanced block navigation across template inheritance chains
- Added support for variable definitions in `{% set %}` and `{% for %}` statements

### 0.0.1

Initial release with basic Go to Definition support:

- Navigate to templates referenced in `{% extends %}` statements
- Navigate to templates referenced in `{% include %}` statements
- Navigate to block definitions in parent templates
- Basic Twig syntax highlighting
- Language configuration for Twig files

## Development

To run this extension in development:

1. Open this project in VS Code
2. Press `F5` to open a new Extension Development Host window
3. Create or open Twig files to test the functionality
4. Use `Ctrl+Click` (or `Cmd+Click` on macOS) on template names or block names to test navigation

## Contributing

This extension is open source. Feel free to contribute improvements and bug fixes.

## License

MIT License - see LICENSE file for details

**Enjoy!**
