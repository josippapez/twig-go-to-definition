# Testing the Twig Go to Definition Extension

This document outlines how to test all the implemented features of the Twig Go to Definition extension.

## Test Files

The `examples/` directory contains test files that demonstrate all supported features:

- `base.twig` - Base template with block definitions
- `page.twig` - Child template that extends base and includes components
- `footer.twig` - Simple included template
- `components/sidebar.twig` - Component template in subdirectory
- `test.twig` - Comprehensive test file with all features

## Features to Test

### 1. Template Navigation

**Extends Navigation:**
1. Open `examples/page.twig`
2. Ctrl+Click (or Cmd+Click on macOS) on `"base.twig"` in the extends statement
3. Should navigate to `base.twig`

**Include Navigation:**
1. In `page.twig`, Ctrl+Click on `"components/sidebar.twig"`
2. Should navigate to `components/sidebar.twig`
3. In `base.twig`, Ctrl+Click on `"footer.twig"`
4. Should navigate to `footer.twig`

### 2. Block Navigation

**Block Definitions:**
1. Open `examples/test.twig`
2. Ctrl+Click on any block name (like `content` or `title`)
3. Should navigate to the corresponding block in `base.twig`

**Parent Calls:**
1. In `test.twig`, find the `{{ parent() }}` call
2. Ctrl+Click on `parent()`
3. Should navigate to the parent template's block definition

**Block Function Calls:**
1. In `test.twig`, find the `{{ block('footer') }}` call
2. Ctrl+Click on `'footer'`
3. Should navigate to the footer block definition

### 3. Variable Navigation

**Variable References:**
1. In `test.twig`, Ctrl+Click on variables like `user`, `item`, or `custom_var`
2. Should navigate to their definitions (set statements, for loop variables)

### 4. Auto-completion

**Template Completion:**
1. Type `{% extends "` and trigger completion (Ctrl+Space)
2. Should show available templates in the workspace

**Block Completion:**
1. Type `{{ block("` and trigger completion
2. Should show available blocks from current and parent templates

**Variable Completion:**
1. Type `{{ ` and start typing a variable name, then trigger completion
2. Should show defined variables

**Tag Completion:**
1. Type `{% ` and trigger completion
2. Should show Twig tags like `block`, `include`, `for`, etc.

### 5. Hover Information

**Template Hover:**
1. Hover over template names in extends/include statements
2. Should show template path and status

**Block Hover:**
1. Hover over block names
2. Should show block information and inheritance details

**Variable Hover:**
1. Hover over variable names
2. Should show variable information and usage count

### 6. Diagnostics

**Missing Template Error:**
1. Change a template name to something that doesn't exist (e.g., `"nonexistent.twig"`)
2. Should show red underline with error message

**Missing Block Warning:**
1. Use `{{ block('nonexistent') }}`
2. Should show warning underline

**Unclosed Block Error:**
1. Add a `{% block test %}` without corresponding `{% endblock %}`
2. Should show error about mismatched blocks

## Testing Tips

1. **Enable Developer Tools**: Press F1 and run "Developer: Reload Window" to reload the extension during development
2. **Check Output**: View → Output → Select "Twig Language Server" to see server logs
3. **Test in Extension Host**: Press F5 to open Extension Development Host for testing
4. **Use Real Projects**: Test with actual Twig projects for more realistic scenarios

## Expected Behavior

- All template references should resolve correctly
- Block navigation should work across inheritance hierarchies
- Variable navigation should work within template scope
- Auto-completion should provide relevant suggestions
- Hover information should be informative and accurate
- Diagnostics should catch common errors and provide helpful messages

## Performance Notes

- The extension should handle moderate-sized template hierarchies without issues
- Very large projects with hundreds of templates may experience slower response times
- Template resolution is cached for better performance
