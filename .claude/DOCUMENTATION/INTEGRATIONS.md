# Integrations Documentation

## MCP Servers

### Serena (File Operations)
- Command: npx -y @anthropics/serena-mcp --headless
- Purpose: Fast file operations, headless browser
- Usage: mcp__serena__read_file(), mcp__serena__search_for_pattern()

### Tavily (Web Research)
- Command: npx -y @tavily/claude-mcp
- Purpose: Web search, content extraction, crawling
- Usage: mcp__tavily__tavily-search(), mcp__tavily__tavily-extract()

### Context7 (Documentation)
- Command: npx -y @anthropics/context7-mcp
- Purpose: Up-to-date library documentation
- Usage: Context7 API integration

### Chrome DevTools (Browser Automation)
- Command: npx -y @anthropics/chrome-devtools-mcp
- Purpose: Browser automation, screenshot, testing
- Usage: Browser automation tasks

### YouTube (Data & Transcripts)
- Command: npx -y @icraft2170/youtube-data-mcp-server
- Purpose: YouTube API access, video metadata, transcripts
- Usage: mcp__youtube__* (search, transcripts, channel data)

### ngze-skyvern (Browser Automation)
- Command: npx -y @ngze/skyvern-mcp
- Purpose: Advanced browser automation with Skyvern
- Usage: mcp__ngze_skyvern__* (automate, extract, navigate)

## Plugins

### feature-dev@claude-code-plugins
- Status: ✅ Enabled
- Purpose: Feature development workflow
- Triggers: "Build X", "Create Y", "Add feature"

### ralph-wiggum@claude-code-plugins
- Status: ✅ Enabled
- Purpose: Uncensored code generation (Big Pickle handover)
- Triggers: Censorship detection, fallback to uncensored model

### canva@claude-code-plugins
- Status: ✅ Enabled
- Purpose: Design integration
- Usage: Canva API access

## Agent Architecture

### Auto-Swarm
- Triggers: Any coding task
- Agents: Claude + Gemini + Conductor + Chrome + Skyvern
- Execution: 100% automatic

### Master Loop
- Phases: 8-phase workflow
- Process: Analysis → Planning → Implementation → Testing → Deployment
- Checkpoints: Automatic state management

### Ralph-Loop
- Purpose: Uncensored generation
- Handover: Seamless fallback on censorship
- Audit: Complete trail in handover-log.md

## Configuration Hierarchy
1. ~/.claude/ (Global source)
2. PROJECT/.claude/ (Project cache)
3. PROJECT/.claude/settings.local.json (Local overrides)
4. PROJECT/.claude/rules.md (Project rules)

Generated: 2026-01-09T12:58:06.541Z
