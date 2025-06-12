# Twig Go to Definition - Feature Suggestions & Roadmap

This document outlines potential features and improvements for the Twig Go to Definition extension to enhance developer experience and productivity.

## 🚀 Enhanced Autocomplete & IntelliSense

### Filter Completion on Typing
- **Description**: Filter autocomplete suggestions based on partial typing
- **Example**: Typing "sec" shows "section-footer.twig", "section-header.twig", etc.
- **Benefit**: Faster template discovery and selection
- **Priority**: High
- **Implementation**: Fuzzy matching in completion provider

### Template Preview in Hover
- **Description**: Show template content preview in hover documentation
- **Example**: Hovering over template name shows first few lines of content
- **Benefit**: Quick understanding of template purpose without opening file
- **Priority**: Medium
- **Implementation**: Read file content and format for markdown display

### Template Metadata in Hover
- **Description**: Display template metadata (size, last modified, author) in hover info
- **Example**: "Modified: 2 hours ago, Size: 1.2KB, Author: John Doe"
- **Benefit**: Better context about template files
- **Priority**: Low
- **Implementation**: File system stats integration

### Template-Specific Snippets
- **Description**: Smart snippets for common Twig patterns
- **Examples**:
  - `block` → `{% block name %}{% endblock %}`
  - `extends` → `{% extends "template.twig" %}`
  - `include` → `{% include "template.twig" %}`
- **Benefit**: Faster template creation
- **Priority**: Medium
- **Implementation**: VS Code snippet contributions

## 🧭 Advanced Navigation Features

### Find All References
- **Description**: Show all places where a template, block, or variable is used
- **Example**: Right-click on template name → "Find All References"
- **Benefit**: Essential for refactoring and understanding code dependencies
- **Priority**: High
- **Implementation**: Document symbol provider with workspace search

### Template Dependency Tree
- **Description**: Visual representation of template inheritance and includes
- **Example**: Tree view showing parent/child relationships
- **Benefit**: Understanding complex template hierarchies
- **Priority**: Medium
- **Implementation**: Custom webview with template graph

### Breadcrumb Navigation
- **Description**: Show current template hierarchy in status bar or breadcrumbs
- **Example**: "base.twig > layout.twig > page.twig"
- **Benefit**: Quick understanding of current context
- **Priority**: Low
- **Implementation**: Status bar integration

### Quick Template Switch
- **Description**: Command palette to quickly switch between related templates
- **Example**: Cmd+P → type template name for instant navigation
- **Benefit**: Faster navigation between related files
- **Priority**: Medium
- **Implementation**: Custom command with template indexing

### Template Outline View
- **Description**: Tree view showing all blocks, variables, includes in current template
- **Example**: Sidebar panel with expandable template structure
- **Benefit**: Quick navigation within large templates
- **Priority**: High
- **Implementation**: Document symbol provider with custom tree view

## 🔧 Refactoring & Code Actions

### Rename Template
- **Description**: Rename template file and update all references automatically
- **Example**: F2 on template → renames file and updates all includes/extends
- **Benefit**: Safe refactoring without breaking references
- **Priority**: High
- **Implementation**: Rename provider with workspace-wide find/replace

### Extract Block
- **Description**: Extract selected code into a new named block
- **Example**: Select code → right-click → "Extract to Block"
- **Benefit**: Better template organization and reusability
- **Priority**: Medium
- **Implementation**: Code action provider with text manipulation

### Move to Template
- **Description**: Move selected code to a new template file
- **Example**: Select code → "Move to New Template" → creates file and include
- **Benefit**: Template splitting and organization
- **Priority**: Medium
- **Implementation**: Code action with file creation and reference updates

### Organize Includes
- **Description**: Sort and group include statements automatically
- **Example**: Sort includes alphabetically or by directory
- **Benefit**: Cleaner, more maintainable template structure
- **Priority**: Low
- **Implementation**: Document formatting provider

### Convert Path Format
- **Description**: Quick action to convert between relative/absolute paths
- **Example**: Right-click on path → "Convert to Absolute/Relative"
- **Benefit**: Easy switching between path formats
- **Priority**: Low
- **Implementation**: Code action with path transformation

## 🔍 Advanced Diagnostics & Validation

### Unused Template Detection
- **Description**: Detect templates that are never included or extended
- **Example**: Warning highlight on unused template files
- **Benefit**: Clean up unused code and reduce project bloat
- **Priority**: Medium
- **Implementation**: Workspace analysis with reference counting

### Circular Dependency Detection
- **Description**: Detect circular template inheritance chains
- **Example**: Error when template A extends B which extends A
- **Benefit**: Prevent runtime errors and infinite loops
- **Priority**: High
- **Implementation**: Graph traversal algorithm in parser

### Missing Variable Warnings
- **Description**: Warn about undefined variables in templates
- **Example**: Highlight `{{ user.name }}` if user variable not defined
- **Benefit**: Catch potential runtime errors early
- **Priority**: Medium
- **Implementation**: Variable scope analysis

### Performance Hints
- **Description**: Suggest optimizations for large template hierarchies
- **Example**: "Consider reducing inheritance depth" for deep chains
- **Benefit**: Better template performance
- **Priority**: Low
- **Implementation**: Template complexity analysis

### Accessibility Validation
- **Description**: Basic accessibility checks for HTML output
- **Example**: Check for missing alt attributes, heading hierarchy
- **Benefit**: Better web accessibility
- **Priority**: Low
- **Implementation**: HTML parsing with accessibility rules

## 🛠️ Development Tools

### Template Hot Reload
- **Description**: Auto-refresh preview when templates change
- **Example**: Live preview panel that updates on file save
- **Benefit**: Faster development feedback loop
- **Priority**: Medium
- **Implementation**: File watcher with preview webview

### Template Formatter
- **Description**: Format Twig templates with proper indentation
- **Example**: Format Document command for Twig files
- **Benefit**: Consistent code style
- **Priority**: Medium
- **Implementation**: Document formatting provider

### Smart Comment Toggling
- **Description**: Intelligent comment/uncomment for Twig syntax
- **Example**: Toggle between `{# #}` and `{# {% block %} #}`
- **Benefit**: Better commenting workflow
- **Priority**: Low
- **Implementation**: Custom comment provider

### Template Generator
- **Description**: Scaffold new templates with boilerplate code
- **Example**: Command to create template with basic structure
- **Benefit**: Faster template creation
- **Priority**: Low
- **Implementation**: File template system

### Import Organizer
- **Description**: Auto-organize and clean up template imports/includes
- **Example**: Sort includes, remove duplicates, group by type
- **Benefit**: Cleaner template organization
- **Priority**: Low
- **Implementation**: Document formatting with include analysis

## 📊 Project Management

### Template Workspace View
- **Description**: Dedicated sidebar view for template navigation
- **Example**: Tree view of all templates organized by directory
- **Benefit**: Better project overview and navigation
- **Priority**: Medium
- **Implementation**: Custom tree view provider

### Template Bookmarks
- **Description**: Bookmark frequently used templates for quick access
- **Example**: Star templates to add to favorites list
- **Benefit**: Faster access to important templates
- **Priority**: Low
- **Implementation**: Workspace state storage

### Project Templates
- **Description**: Template sets for different project types (Symfony, Craft, etc.)
- **Example**: "Create Symfony Template Set" command
- **Benefit**: Faster project setup
- **Priority**: Low
- **Implementation**: Template scaffolding system

### Template Metrics
- **Description**: Statistics about template usage and complexity
- **Example**: Dashboard showing most used templates, inheritance depth
- **Benefit**: Project insights and optimization opportunities
- **Priority**: Low
- **Implementation**: Usage tracking and analytics

## ⚙️ Enhanced Settings & Customization

### Additional Configuration Options
```json
{
  "twigGoToDefinition.completion.filterOnType": {
    "type": "boolean",
    "default": true,
    "description": "Filter autocomplete suggestions based on typing"
  },
  "twigGoToDefinition.completion.showPreview": {
    "type": "boolean",
    "default": false,
    "description": "Show template content preview in completion"
  },
  "twigGoToDefinition.navigation.showBreadcrumbs": {
    "type": "boolean",
    "default": true,
    "description": "Show template hierarchy in breadcrumbs"
  },
  "twigGoToDefinition.formatting.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable Twig template formatting"
  },
  "twigGoToDefinition.validation.checkUnusedTemplates": {
    "type": "boolean",
    "default": true,
    "description": "Warn about unused template files"
  },
  "twigGoToDefinition.validation.checkMissingVariables": {
    "type": "boolean",
    "default": false,
    "description": "Warn about potentially undefined variables"
  },
  "twigGoToDefinition.workspace.showTreeView": {
    "type": "boolean",
    "default": true,
    "description": "Show template tree view in sidebar"
  },
  "twigGoToDefinition.performance.maxFileSize": {
    "type": "number",
    "default": 1048576,
    "description": "Maximum file size to parse (in bytes)"
  }
}
```

## 🔗 Integration Features

### Multi-Root Workspace Support
- **Description**: Support for multiple Twig projects in one workspace
- **Example**: Different template directories for different projects
- **Benefit**: Better monorepo support
- **Priority**: Medium
- **Implementation**: Multi-folder workspace handling

### Framework Detection
- **Description**: Auto-configure for Symfony, Craft CMS, Drupal, etc.
- **Example**: Detect framework and set appropriate template directories
- **Benefit**: Zero-configuration setup for common frameworks
- **Priority**: Medium
- **Implementation**: Project file detection and configuration

### Live Preview
- **Description**: Preview rendered templates directly in VS Code
- **Example**: Side panel showing HTML output with test data
- **Benefit**: Immediate visual feedback
- **Priority**: High
- **Implementation**: Twig rendering engine integration

### Template Linting
- **Description**: Integration with external Twig linters
- **Example**: Show Twig-CS-Fixer or other linter results
- **Benefit**: Code quality enforcement
- **Priority**: Medium
- **Implementation**: External tool integration

## ⚡ Performance Improvements

### Incremental Parsing
- **Description**: Only re-parse changed templates instead of full workspace
- **Example**: File watcher triggers selective re-parsing
- **Benefit**: Faster response times in large projects
- **Priority**: High
- **Implementation**: Change detection and selective parsing

### Template Caching
- **Description**: Cache parsed template information between sessions
- **Example**: Store template metadata in workspace cache
- **Benefit**: Faster startup times
- **Priority**: Medium
- **Implementation**: Persistent cache with invalidation

### Background Indexing
- **Description**: Build template index in background without blocking UI
- **Example**: Progress indicator during initial workspace scan
- **Benefit**: Better user experience during startup
- **Priority**: Medium
- **Implementation**: Worker threads for parsing

### Lazy Loading
- **Description**: Load template information only when needed
- **Example**: Parse templates on first access rather than startup
- **Benefit**: Faster startup for large projects
- **Priority**: Low
- **Implementation**: On-demand parsing strategy

## 🎨 User Experience Enhancements

### Interactive Welcome Guide
- **Description**: Tutorial walkthrough for new users
- **Example**: Overlay guide showing key features
- **Benefit**: Better onboarding experience
- **Priority**: Low
- **Implementation**: Custom webview tutorial

### Status Bar Indicators
- **Description**: Show current template context and status
- **Example**: "base.twig → page.twig" in status bar
- **Benefit**: Better awareness of current context
- **Priority**: Low
- **Implementation**: Status bar contribution

### Progress Indicators
- **Description**: Show progress for long-running operations
- **Example**: Progress bar during workspace indexing
- **Benefit**: Better feedback during processing
- **Priority**: Low
- **Implementation**: VS Code progress API

### Error Recovery
- **Description**: Better handling of malformed templates
- **Example**: Continue parsing despite syntax errors
- **Benefit**: More robust extension behavior
- **Priority**: Medium
- **Implementation**: Error-tolerant parser

### Configurable Keyboard Shortcuts
- **Description**: Customizable hotkeys for common actions
- **Example**: Ctrl+Alt+T for "Go to Template"
- **Benefit**: Faster workflow for power users
- **Priority**: Low
- **Implementation**: Keybinding contributions

## 🎯 Implementation Priority

### High Priority (Quick Wins)
1. **Filter completion on typing** - Immediate UX improvement
2. **Find all references** - Essential navigation feature
3. **Template outline view** - Great for template understanding
4. **Circular dependency detection** - Prevents critical errors
5. **Incremental parsing** - Performance improvement

### Medium Priority (Valuable Features)
1. **Rename template refactoring** - Important workflow feature
2. **Template workspace view** - Better project navigation
3. **Template hot reload** - Development experience
4. **Multi-root workspace** - Better project support
5. **Live preview** - Visual development aid

### Low Priority (Nice to Have)
1. **Template bookmarks** - Convenience feature
2. **Accessibility validation** - Specialized use case
3. **Template metrics** - Analytics and insights
4. **Welcome guide** - Onboarding improvement

## 💡 Implementation Notes

- Start with features that provide immediate value to developers
- Focus on stability and performance before adding complex features
- Consider VS Code API limitations and capabilities
- Maintain backward compatibility with existing configurations
- Gather user feedback to prioritize feature development
- Consider impact on extension size and startup time

## 🔄 Next Steps

1. **User Survey**: Gather feedback on most desired features
2. **Prototype Development**: Build proof-of-concept for high-priority features
3. **Performance Testing**: Ensure new features don't impact performance
4. **Documentation**: Update guides and documentation for new features
5. **Community Feedback**: Share roadmap with users for input

---

This roadmap is a living document that should be updated based on user feedback, technical constraints, and changing priorities in the Twig ecosystem.
