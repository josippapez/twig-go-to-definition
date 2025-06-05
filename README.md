# Twig Go to Definition

A VS Code extension that provides "Go to Definition" functionality for Twig template files using the Language Server Protocol.

## Features

This extension adds intelligent navigation support for Twig templates:

- **Template Navigation**: Click on template names in `{% extends %}` and `{% include %}` statements to jump to the referenced template file
- **Block Navigation**: Navigate from block references to their definitions in parent templates
- **Variable References**: Support for Twig variable navigation (coming soon)
- **Automatic File Discovery**: Intelligent resolution of template paths across common Twig project structures

### Supported Twig Features

- `{% extends "template.twig" %}` - Navigate to parent template
- `{% include "partial.twig" %}` - Navigate to included template
- `{% block content %}` - Navigate to block definitions in parent templates
- Variable references in `{{ variable }}` syntax (planned)

## Requirements

- VS Code 1.100.0 or higher
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

- Variable reference navigation is not yet implemented
- Only supports basic Twig syntax patterns
- Template path resolution may not work with complex custom directory structures

## Release Notes

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
