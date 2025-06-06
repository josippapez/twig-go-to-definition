# Twig Go to Definition Examples

This directory contains comprehensive examples that demonstrate all the features of the Twig Go to Definition extension.

## File Structure

```
examples/
├── base.twig                    # Base template with multiple blocks
├── page.twig                    # Child template with basic features
├── test.twig                    # Simple test template
├── advanced.twig                # Advanced features demonstration
├── blog-layout.twig             # Intermediate template inheritance
├── blog-post.twig               # Complex template inheritance
├── footer.twig                  # Simple included template
└── components/
    ├── sidebar.twig             # Component with variables and loops
    ├── newsletter.twig          # Form component with variables
    ├── content-section.twig     # Dynamic content component
    ├── section-footer.twig      # Nested component with conditionals
    └── post-navigation.twig     # Navigation component with logic
```

## Template Hierarchy

### Basic Inheritance
- `base.twig` → `page.twig`
- `base.twig` → `test.twig`

### Advanced Inheritance
- `base.twig` → `blog-layout.twig` → `blog-post.twig`
- `base.twig` → `advanced.twig`

## Features Demonstrated

### 1. Template Navigation
- **Extends**: All child templates extend `base.twig`
- **Includes**: Templates include various components from the `components/` directory

### 2. Block Navigation
- **Block Definitions**: `base.twig` defines multiple blocks (title, content, sidebar, footer, etc.)
- **Block Overrides**: Child templates override parent blocks
- **Parent Calls**: `{{ parent() }}` calls to inherit parent block content

### 3. Block Function Calls
- **Block References**: `{{ block('name') }}` to reference other blocks
- **Cross-template References**: Accessing blocks defined in parent templates

### 4. Variable Features
- **Variable Definitions**: `{% set %}` statements
- **Loop Variables**: `{% for %}` loops with variables
- **Variable References**: `{{ variable }}` syntax
- **Complex Variables**: Arrays, objects, and calculated values

### 5. Advanced Features
- **Conditional Logic**: `{% if %}` statements with variables
- **Macro Definitions**: Reusable code blocks
- **Include with Context**: Passing variables to included templates
- **Template Inheritance Chains**: Multi-level template extension

## Testing Navigation

### Template Navigation Tests
1. **base.twig → footer.twig**: Ctrl+Click on `"footer.twig"` in the include statement
2. **page.twig → base.twig**: Ctrl+Click on `"base.twig"` in the extends statement
3. **page.twig → sidebar.twig**: Ctrl+Click on `"components/sidebar.twig"`

### Block Navigation Tests
1. **page.twig content block**: Ctrl+Click on `content` to go to base template
2. **advanced.twig parent() calls**: Ctrl+Click on `parent()` to see parent block
3. **blog-post.twig block references**: Ctrl+Click on block function calls

### Variable Navigation Tests
1. **Variables in sidebar.twig**: Ctrl+Click on `post_count`, `category`, etc.
2. **Loop variables**: Ctrl+Click on `item`, `tag`, `post` in for loops
3. **Set variables**: Ctrl+Click on variables defined with `{% set %}`

### Auto-completion Tests
1. **Template completion**: Type `{% extends "` and trigger completion (Ctrl+Space)
2. **Block completion**: Type `{{ block("` and trigger completion
3. **Variable completion**: Type `{{ ` and trigger completion

### Hover Information Tests
1. **Template hover**: Hover over template names to see path information
2. **Block hover**: Hover over block names to see inheritance info
3. **Variable hover**: Hover over variables to see usage information

## Common Patterns Demonstrated

### Template Inheritance
```twig
{% extends "base.twig" %}
{% block content %}
    {{ parent() }}
    <!-- Additional content -->
{% endblock %}
```

### Component Inclusion
```twig
{% include "components/sidebar.twig" with {
    'title': 'Custom Title',
    'show_categories': true
} %}
```

### Variable Management
```twig
{% set calculated_value = some_value + other_value %}
{% for item in items %}
    {% set item_class = loop.first ? 'first' : 'normal' %}
    <!-- Use variables -->
{% endfor %}
```

### Block References
```twig
<div class="sidebar-content">
    {{ block('sidebar') }}
</div>
```

## Best Practices Shown

1. **Consistent Naming**: Clear, descriptive names for templates, blocks, and variables
2. **Logical Hierarchy**: Organized template inheritance structure
3. **Component Reuse**: Modular components that can be included with different contexts
4. **Variable Scoping**: Proper use of variable scope and context passing
5. **Documentation**: Comments explaining complex logic and relationships

## Testing Your Extension

Use these examples to test the extension functionality:

1. Open any template file
2. Use Ctrl+Click (Cmd+Click on macOS) to navigate between templates and blocks
3. Hover over elements to see contextual information
4. Use auto-completion when typing Twig syntax
5. Check the Problems panel for any diagnostics

The extension should provide seamless navigation between all related templates and accurate information about blocks, variables, and template relationships.
