# YouTube MCP Server Setup Guide

## Overview
The YouTube MCP server has been successfully integrated into your Claude Code environment. This guide explains how to complete the setup with your free YouTube API key.

## What Was Integrated

### 1. Global Configuration (`~/.claude/settings.local.json`)
```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "@icraft2170/youtube-data-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "YOUR_YOUTUBE_API_KEY_HERE",
        "YOUTUBE_TRANSCRIPT_LANG": "en"
      }
    }
  },
  "permissions": {
    "allow": ["mcp__youtube__*"]
  }
}
```

### 2. Master Start Script Integration
- Added 'youtube' to required servers list
- Added YouTube API key verification in final checks
- Provides automatic setup instructions when key is missing

## 🎯 How to Get Your FREE YouTube API Key

### Step 1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. Sign in with your Google account
3. Click **"Create Project"**
4. Enter a project name (e.g., "claude-youtube-mcp")
5. Click **"Create"**

### Step 2: Enable YouTube Data API v3
1. In your new project, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it
4. Click **"Enable"**

### Step 3: Create API Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API key"**
3. Copy the generated API key (format: `AIzaSy...`)

### Step 4: Update Your Configuration
Edit `~/.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "@icraft2170/youtube-data-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "AIzaSyYOUR_ACTUAL_KEY_HERE",
        "YOUTUBE_TRANSCRIPT_LANG": "en"
      }
    }
  }
}
```

### Step 5: Restart Claude Code
```bash
# Close and reopen Claude Code, or run:
npx claude "/start"
```

## 🚀 Available YouTube Functions

Once configured, you can use these commands in Claude:

### Video Search
```
"Search for Python tutorials on YouTube"
"Find videos about React hooks"
"Look up machine learning courses"
```

### Transcript Retrieval
```
"Get transcript for video https://youtu.be/VIDEO_ID"
"Download subtitles for this YouTube video"
"Extract transcript from video URL"
```

### Video Information
```
"Get details about video https://youtu.be/VIDEO_ID"
"Show me channel info for [channel name]"
"Get video statistics"
```

## 🔧 Troubleshooting

### "YouTube API key not found"
**Solution:** Make sure you've updated `settings.local.json` with your actual API key and restarted Claude.

### "Quota exceeded"
**Solution:** YouTube API has free daily quota (10,000 units). For most use cases, this is sufficient. You can request higher quota if needed.

### "Transcript not available"
**Solution:** Not all videos have transcripts. The server will return an error if no transcript is available.

## 💡 Usage Examples

### Research Workflow
```
User: "Find me the latest videos about MCP servers and summarize their transcripts"
Claude: [Uses YouTube MCP to search + extract transcripts + summarize]
```

### Learning
```
User: "Teach me about React by finding good tutorials on YouTube"
Claude: [Searches YouTube + retrieves transcripts + creates learning guide]
```

### Content Analysis
```
User: "Analyze trends in AI development videos from the last month"
Claude: [Searches YouTube + analyzes transcripts + identifies patterns]
```

## 📊 API Quota Information

- **Free Tier:** 10,000 units/day
- **Typical Usage:**
  - Search: 100 units per request
  - Video details: 1 unit per request
  - Transcript: 1-5 units per request
- **Cost:** Free (within quota)

## 🔒 Security Best Practices

1. **Keep API key private** - Never commit to git
2. **Restrict API key** - You can restrict it to YouTube Data API only
3. **Monitor usage** - Check Google Cloud Console regularly
4. **Rotate if needed** - Create new key if compromised

## ✅ Verification

After setup, verify with:
```bash
# Check if YouTube MCP is loaded
node ~/.claude/EXECUTORS/master-start-script.js

# Or in Claude, ask:
"Search for test video about JavaScript"
```

---

**Status:** ✅ Integration Complete | **API Key:** ❌ Required

**Next Step:** Get your free API key from Google Cloud Console and update `~/.claude/settings.local.json`
