# Serena MCP Setup Documentation

## Configuration
```json
{
  "mcpServers": {
    "serena": {
      "command": "npx",
      "args": ["-y", "@anthropics/serena-mcp", "--headless"],
      "env": {
        "BROWSER": "none",
        "CI": "true"
      }
    }
  }
}
```

## Features
- Headless browser automation
- File operations without GUI
- Fast filesystem access
- CI/CD compatible

## Usage
- Read files: mcp__serena__read_file()
- Write files: mcp__serena__create_text_file()
- Search: mcp__serena__search_for_pattern()
- Edit: mcp__serena__replace_content()

## Troubleshooting
- Browser opens: Add --headless flag
- CI errors: Set CI=true
- Slow performance: Check network

Generated: 2026-01-09T12:58:06.501Z
