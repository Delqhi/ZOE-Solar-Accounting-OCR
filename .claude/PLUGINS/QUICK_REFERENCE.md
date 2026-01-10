# Quick Reference - Integrations

## MCP Commands

### File Operations (Serena)
```
mcp__serena__read_file(path)
mcp__serena__create_text_file(path, content)
mcp__serena__replace_content(path, needle, repl, mode)
mcp__serena__search_for_pattern(pattern)
mcp__serena__list_dir(path, recursive)
```

### Web Research (Tavily)
```
mcp__tavily__tavily-search(query)
mcp__tavily__tavily-extract(urls)
mcp__tavily__tavily-crawl(url)
mcp__tavily__tavily-map(url)
```

## Plugin Triggers

### Auto-Swarm (Automatic)
- "Baue X" → Full swarm
- "Fix Y" → Swarm + tests
- "Create Z" → Complete workflow
- "Deploy" → Auto-deploy

### Ralph-Loop (Uncensored)
- Censorship detected → Big Pickle handover
- "Verboten" → Auto-fallback
- Full audit trail

### Master Loop (8-Phase)
- Analysis → Planning → Implementation
- Testing → Checkpoint → Deployment
- Monitoring → Vision Gate

## Integration Status
✅ All MCP servers configured
✅ All plugins enabled
✅ Documentation complete
✅ Ready for use

## Next Steps
1. Run: /start (sync to projects)
2. Test: "Read file X" (uses Serena)
3. Test: "Search for Y" (uses Tavily)
4. Build: "Create Z" (triggers swarm)

Generated: 2026-01-09T12:58:06.541Z
