# Twig Go to Definition

A VS Code extension that provides "Go to Definition" functionality for Twig template files using the Language Server Protocol.

## Features

This extension adds intelligent navigation support for Twig templates:

- **Template Navigation**: Click on template names in `{% extends %}` and `{% include %}` statements to jump to the referenced template file
- **Block Navigation**: Navigate from block references to their definitions in parent templates
- **Parent Call Navigation**: Navigate from `{{ parent() }}` calls to the parent template's block definition
- **Block Function Navigation**: Navigate from `{{ block('name') }}` calls to block definitions
- **Variable References**: Navigate to variable definitions within templates
- **Auto-completion**: Intelligent completion for template names, block names, variables, and Twig tags with configurable path resolution
- **Hover Information**: Detailed information about templates, blocks, and variables on hover
- **Diagnostics**: Real-time validation of template references and syntax
- **Automatic File Discovery**: Intelligent resolution of template paths across common Twig project structures
- **Configurable Path Resolution**: Choose between smart, absolute, or relative path suggestions in autocomplete
- **Customizable Template Directories**: Configure which folders to search for templates

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

### `twigGoToDefinition.pathResolution`
- **Type**: `string`
- **Default**: `"smart"`
- **Options**: `"smart"`, `"absolute"`, `"relative"`
- **Description**: Controls how template paths are suggested in autocomplete
  - **Smart**: Use relative paths within same top-level folder, absolute paths for cross-folder references
  - **Absolute**: Always use full paths from workspace root (e.g., `examples/base.twig`)
  - **Relative**: Always use relative paths from current file (e.g., `../base.twig`)

### `twigGoToDefinition.templateDirectories`
- **Type**: `array`
- **Default**: `["templates", "views", "src/templates", "examples"]`
- **Description**: Additional directories to search for Twig templates

### `twigGoToDefinition.diagnostics.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable error checking for missing templates and blocks

## Usage

### Accessing Settings
1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "Twig Go to Definition"
3. Configure your preferred path resolution and template directories

### Path Resolution Examples
When editing `examples/components/content-section.twig`:

**Smart Mode** (default):
- Same directory: `section-footer.twig`
- Parent folder: `../base.twig`
- Different top-level: `templates/layout.twig`

**Absolute Mode**:
- Same directory: `examples/components/section-footer.twig`
- Parent folder: `examples/base.twig`
- Different top-level: `templates/layout.twig`

**Relative Mode**:
- Same directory: `./section-footer.twig`
- Parent folder: `../base.twig`
- Different top-level: `../../templates/layout.twig`

## Template Path Resolution

The extension provides intelligent template path resolution with multiple strategies:

### Default Search Directories
The extension automatically searches for templates in these directories:
- Relative to current file
- `templates/` directory
- `views/` directory
- `src/templates/` directory
- `app/Resources/views/` directory (Symfony)
- `examples/` directory (for testing)
- Workspace root

### Path Resolution Strategies

**Smart Resolution** (Default):
- Uses the most intuitive path for each context
- Same directory: just filename
- Same top-level folder: relative path
- Different folders: absolute from workspace root

**Absolute Resolution**:
- Always shows full path from workspace root
- Consistent absolute references
- Best for large projects with complex folder structures

**Relative Resolution**:
- Always shows path relative to current file
- Traditional relative path behavior
- Best for developers who prefer explicit relative paths

### Configurable Template Directories
You can customize which directories the extension searches by modifying the `twigGoToDefinition.templateDirectories` setting.

## Known Issues

- Variable reference navigation is limited to local template scope
- Complex Twig expressions may not be fully supported
- Performance may be impacted with very large template hierarchies
- Some edge cases in deeply nested template inheritance may not be fully supported

## Troubleshooting

### Common Issues

**Templates not found in autocomplete:**
1. Check that templates are in configured directories (`twigGoToDefinition.templateDirectories`)
2. Verify file extensions are `.twig` or `.html.twig`
3. Check VS Code Output panel → "Twig Language Server" for path resolution details

**Go to Definition not working:**
1. Ensure the template file exists and is readable
2. Check the Output panel for error messages
3. Verify template paths match the configured resolution strategy

**Autocomplete showing wrong paths:**
1. Adjust the `twigGoToDefinition.pathResolution` setting
2. Customize `twigGoToDefinition.templateDirectories` for your project structure

### Debugging

Enable detailed logging by checking the Output panel:
1. Open Output panel (`View > Output`)
2. Select "Twig Language Server" from dropdown
3. Trigger the feature to see detailed logs

## Release Notes

### 0.0.6

Added comprehensive configuration system:

- **Configurable Path Resolution**: Choose between smart, absolute, or relative path suggestions
- **Customizable Template Directories**: Configure which folders to search for templates
- **Settings Integration**: Full VS Code settings integration with live configuration updates
- **Enhanced Autocomplete**: Context-aware path suggestions based on current file location and settings
- **Improved Path Intelligence**: Better handling of same-directory and cross-directory template references

### 0.0.5

Major improvements to autocomplete and path resolution:

- **Smart Path Suggestions**: Intelligent path resolution based on file location context
- **Enhanced Autocomplete**: Improved template name completion with better sorting and context
- **Same-Directory Optimization**: Prioritized suggestions for files in the same directory
- **Cross-Directory Intelligence**: Smart handling of templates across different project folders
- **Extensive Debugging**: Added comprehensive logging for troubleshooting path resolution

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
