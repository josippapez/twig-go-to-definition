export function fuzzyMatch(text: string, pattern: string): boolean {
  if (pattern === '') {
    return true;
  }

  const textLower = text.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Simple fuzzy matching: check if pattern characters appear in order
  let patternIndex = 0;
  for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIndex]) {
      patternIndex++;
    }
  }

  return patternIndex === patternLower.length;
}

export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to read template content and metadata for hover previews
export function getTemplatePreview(templatePath: string): { content: string; metadata: string } | null {
  const fs = require('fs');

  try {
    // Check if file exists and get stats
    const stats = fs.statSync(templatePath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);
    const lastModified = stats.mtime.toLocaleDateString();

    // Don't read very large files (over 100KB)
    if (stats.size > 100 * 1024) {
      return {
        content: '*File too large to preview*',
        metadata: `**Size**: ${fileSizeKB} KB | **Modified**: ${lastModified}`
      };
    }

    // Read file content
    const content = fs.readFileSync(templatePath, 'utf-8');

    // Get first few lines for preview (max 10 lines or 500 characters)
    const lines = content.split('\n');
    const previewLines = lines.slice(0, 10);
    let preview = previewLines.join('\n');

    // Truncate if too long
    if (preview.length > 500) {
      preview = preview.substring(0, 500) + '...';
    }

    // Add "..." if there are more lines
    if (lines.length > 10) {
      preview += '\n...';
    }

    return {
      content: preview,
      metadata: `**Size**: ${fileSizeKB} KB | **Lines**: ${lines.length} | **Modified**: ${lastModified}`
    };
  } catch (error) {
    return {
      content: '*Could not read file*',
      metadata: '*File information unavailable*'
    };
  }
}
