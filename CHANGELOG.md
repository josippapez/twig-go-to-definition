# Change Log

All notable changes to the "twig-go-to-definition" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
