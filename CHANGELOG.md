# Change Log

All notable changes to the "twig-go-to-definition" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.8] - 2025-06-12

### Added

- **Template Preview in Hover**: Hover over template names now shows content preview and metadata
  - Displays first 10 lines or 500 characters of template content
  - Shows file size, line count, and last modified date
  - Safely handles large files with size warnings
  - Formatted code preview with syntax highlighting in hover tooltips

### Enhanced

- Improved hover experience for `{% extends %}` and `{% include %}` statements
- Better error handling for file reading operations
- More informative template documentation

## [0.0.7] - 2025-06-12

### Added

- **Smart Autocomplete Filtering**: Real-time filtering with fuzzy matching for template suggestions
- **Find All References**: Right-click to find all usages of templates, blocks, and variables
- **Template Outline View**: Document symbol provider showing template structure in outline panel
- **Cross-directory Template Discovery**: Autocomplete now finds templates in subdirectories
- **Enhanced Scoring System**: Better relevance ranking for autocomplete suggestions

### Enhanced

- Improved autocomplete performance with intelligent filtering
- Better path resolution for templates in different directories
- Enhanced error handling and validation
- Comprehensive logging for debugging

### Fixed

- Autocomplete not working for partial template names
- Cross-directory template matching issues
- Empty document symbol names causing errors

## [0.0.1] - 2025-06-05

### Added

- Initial release of Twig Go to Definition extension
- Language Server Protocol implementation for Twig files
- Go to Definition support for `{% extends %}` statements
- Go to Definition support for `{% include %}` statements
- Go to Definition support for `{% block %}` references
- Basic Twig syntax highlighting
- Language configuration for Twig files (.twig and .html.twig)
- Automatic template path resolution across common project structures
- Support for relative and absolute template paths

### Features

- Navigate to parent templates from extends statements
- Navigate to included templates from include statements
- Navigate to block definitions in parent templates
- Intelligent template file discovery in multiple directory patterns
- Full Language Server Protocol integration
