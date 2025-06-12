# Twig Go to Definition - Feature Suggestions & Roadmap

This document outlines potential features and improvements for the Twig Go to Definition extension to enhance developer experience and productivity.

## ✅ **Already Implemented Features (v0.0.7)**

### Enhanced Autocomplete & IntelliSense
- ✅ **Filter Completion on Typing** - Smart filtering with fuzzy matching
- ✅ **Cross-directory Template Discovery** - Find templates in any subdirectory
- ✅ **Smart Scoring** - Relevance-based completion ordering

### Advanced Navigation Features
- ✅ **Find All References** - Right-click to find all usages of templates, blocks, variables
- ✅ **Template Outline View** - Document symbol provider showing template structure
- ✅ **Go to Definition** - Navigate to templates, blocks, variables

### Configuration & Settings
- ✅ **Configurable Path Resolution** - Smart, absolute, or relative path suggestions
- ✅ **Custom Template Directories** - Configure search directories
- ✅ **Settings Integration** - Full VS Code settings integration

### Developer Experience
- ✅ **Hover Information** - Detailed template, block, and variable information
- ✅ **Template Preview in Hover** - Show template content preview with metadata
- ✅ **Real-time Diagnostics** - Template validation and error detection
- ✅ **Enhanced Error Handling** - Robust parsing with validation

---

## 🚀 **Remaining High-Priority Features**

### Rename Template Refactoring
- **Description**: Rename template file and update all references automatically
- **Example**: F2 on template → renames file and updates all includes/extends
- **Benefit**: Safe refactoring without breaking references
- **Priority**: High
- **Implementation**: Rename provider with workspace-wide find/replace

### Circular Dependency Detection
- **Description**: Detect circular template inheritance chains
- **Example**: Error when template A extends B which extends A
- **Benefit**: Prevent runtime errors and infinite loops
- **Priority**: High
- **Implementation**: Graph traversal algorithm in parser

## 🧭 **Enhanced Navigation Features**

### Template Dependency Tree
- **Description**: Visual representation of template inheritance and includes
- **Example**: Tree view showing parent/child relationships
- **Benefit**: Understanding complex template hierarchies
- **Priority**: Medium
- **Implementation**: Custom webview with template graph

### Quick Template Switch
- **Description**: Command palette to quickly switch between related templates
- **Example**: Cmd+P → type template name for instant navigation
- **Benefit**: Faster navigation between related files
- **Priority**: Medium
- **Implementation**: Custom command with template indexing

### Template Workspace View
- **Description**: Dedicated sidebar view for template navigation
- **Example**: Tree view of all templates organized by directory
- **Benefit**: Better project overview and navigation
- **Priority**: Medium
- **Implementation**: Custom tree view provider

## 🔧 **Refactoring & Code Actions**

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

### Convert Path Format
- **Description**: Quick action to convert between relative/absolute paths
- **Example**: Right-click on path → "Convert to Absolute/Relative"
- **Benefit**: Easy switching between path formats
- **Priority**: Low
- **Implementation**: Code action with path transformation

## 🔍 **Advanced Diagnostics & Validation**

### Unused Template Detection
- **Description**: Detect templates that are never included or extended
- **Example**: Warning highlight on unused template files
- **Benefit**: Clean up unused code and reduce project bloat
- **Priority**: Medium
- **Implementation**: Workspace analysis with reference counting

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

## 🛠️ **Development Tools**

### Template Generator
- **Description**: Scaffold new templates with boilerplate code
- **Example**: Command to create template with basic structure
- **Benefit**: Faster template creation
- **Priority**: Low
- **Implementation**: File template system

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

## 🎯 **Updated Implementation Priority**

### Next High Priority Features (Quick Wins)

1. **Rename Template Refactoring** - Essential workflow improvement for safe refactoring
2. **Circular Dependency Detection** - Prevents critical runtime errors
3. **Incremental Parsing** - Faster response times in large projects

### Medium Priority Features (Valuable Additions)

1. **Template Dependency Tree** - Visual understanding of template relationships
2. **Template Workspace View** - Better project navigation and organization
3. **Template Hot Reload** - Development workflow enhancement
4. **Unused Template Detection** - Code cleanup and project maintenance

### Low Priority Features (Nice to Have)
1. **Template-Specific Snippets** - Developer productivity boost
2. **Quick Template Switch** - Navigation convenience
3. **Extract Block Refactoring** - Advanced refactoring capability
4. **Template Generator** - Scaffolding and boilerplate reduction
5. **Performance Hints** - Optimization guidance

## 💡 **Implementation Recommendations**

### For Next Version (0.0.9)
Focus on **Rename Template Refactoring** as it provides essential workflow improvements and builds on the existing "Find All References" functionality.

**Implementation approach**:
- Use VS Code's rename provider API
- Leverage existing "Find All References" functionality
- Update all include/extend statements
- Handle file system operations safely

### For Version 0.0.10
Implement **Circular Dependency Detection** for robustness.

**Implementation approach**:
- Extend existing template parser
- Implement graph traversal algorithm
- Add diagnostic provider for circular references
- Provide clear error messages and suggestions

### For Version 0.1.0
Add **Incremental Parsing** for performance improvements.

**Implementation approach**:
- Extend existing template parser
- Implement graph traversal algorithm
- Add diagnostic provider for circular references
- Provide clear error messages and suggestions

---

## 📋 **Implementation Notes**

- **Performance**: All new features should maintain fast response times
- **Backward Compatibility**: Preserve existing configurations and behavior
- **Error Handling**: Robust error handling for file operations and parsing
- **User Experience**: Features should integrate seamlessly with existing workflows
- **Documentation**: Update README and guides for new features

## 🔄 **Next Steps**

1. **Choose Next Feature**: Start with Template Preview in Hover for immediate impact
2. **User Feedback**: Gather input on which features are most valuable
3. **Prototype Development**: Build proof-of-concept implementations
4. **Testing**: Ensure new features work across different project structures
5. **Documentation**: Update extension documentation and examples

---

This roadmap is a living document that should be updated based on user feedback, technical constraints, and changing priorities in the Twig ecosystem.
