# Research Agent Guide (PhD-Level Research)

## 🎯 Overview
**Origin**: Custom PhD-level research system  
**Core Principle**: Hypothesis-driven multi-agent research  
**Use Case**: State-of-the-art research with academic rigor

## 📋 Key Features

### 1. Hypothesis-Driven Approach
```javascript
// Research starts with hypothesis
Hypothesis → Research Tree → Parallel Agents → Verification → Synthesis
```

### 2. Parallel Research Agents
```
┌─────────────────────────────────────────┐
│  5 Simultaneous Search Agents           │
├─────────────────────────────────────────┤
│  📚 Academic Agent (Papers, Journals)   │
│  💼 Industry Agent (Blogs, Case Studies)│
│  📈 Trends Agent (Emerging Patterns)    │
│  🧪 Counter-Evidence Agent (Opposing)   │
│  🌐 Cross-Disciplinary Agent (Related)  │
└─────────────────────────────────────────┘
```

### 3. 3-Phase Verification
```
Phase 1: Exploration (Broad)
├─ Multiple sources
├─ Diverse perspectives
└─ Initial hypothesis validation

Phase 2: Deep Dive (Narrow)
├─ Specific sources
├─ Detailed analysis
└─ Evidence gathering

Phase 3: Synthesis (Comprehensive)
├─ Cross-reference
├─ Bias detection
├─ Confidence scoring
└─ Final report
```

### 4. Chain-of-Thought
```xml
<thinking>
Hypothesis: [statement]
Approach: [methodology]
Sources: [list]
Confidence: [0-100%]
Bias Check: [analysis]
</thinking>
```

### 5. Confidence Scoring
```javascript
// Per claim scoring
{
  claim: "React is faster than Vue",
  confidence: 85,
  sources: 12,
  reliability: "high",
  bias: "low",
  temporal: "2026-01-08"
}
```

### 6. Bias Detection
```javascript
// Source credibility analysis
{
  source: "Example Paper",
  credibility: "high",
  funding: "independent",
  peerReviewed: true,
  temporalRelevance: "recent",
  citations: 450
}
```

## 🚀 Usage in Claude Code

### Activation Triggers
```
"Research [topic] using PhD-level methodology"
"Enter research mode for [topic]"
"Test hypothesis: [statement]"
"PhD-level analysis of [topic]"
```

### Complete Research Workflow
```
User: "Research: AI code generation quality 2026"

Phase 1: Exploration (5 min)
├─ Academic Agent: 15 papers
├─ Industry Agent: 20 case studies
├─ Trends Agent: 30 articles
├─ Counter-Evidence: 5 critiques
├─ Cross-Disciplinary: 8 related fields
└─ Output: 78 sources identified

Phase 2: Deep Dive (15 min)
├─ Top 10 papers analyzed
├─ Key metrics extracted
├─ Methodology compared
└─ Output: Detailed findings

Phase 3: Synthesis (10 min)
├─ Cross-reference all sources
├─ Detect biases
├─ Score confidence
├─ Generate report
└─ Output: Comprehensive analysis
```

## 📋 Research Tree Structure

### Hypothesis Formation
```markdown
## Research Hypothesis
AI code generation quality in 2026 is primarily determined by:
1. Training data quality (weight: 0.4)
2. Model architecture (weight: 0.3)
3. Fine-tuning approach (weight: 0.2)
4. Human feedback (weight: 0.1)
```

### Research Questions
```markdown
## Research Questions
1. What metrics define "quality" in code generation?
2. How has quality improved from 2024-2026?
3. What are current limitations?
4. What future improvements are predicted?
5. How does this affect development workflows?
```

## 🔍 Multi-Agent Strategy

### Academic Agent
**Sources**: arXiv, IEEE, ACM, Journals  
**Focus**: Peer-reviewed research  
**Output**: Technical depth  
**Example**: "According to Smith et al. 2025..."

### Industry Agent
**Sources**: Tech blogs, Case studies, Whitepapers  
**Focus**: Real-world applications  
**Output**: Practical insights  
**Example**: "GitHub's 2025 report shows..."

### Trends Agent
**Sources**: News, Conferences, Social media  
**Focus**: Emerging patterns  
**Output**: Forward-looking  
**Example**: "Recent trends indicate..."

### Counter-Evidence Agent
**Sources**: Critiques, Limitations, Failures  
**Focus**: Opposing views  
**Output**: Balanced perspective  
**Example**: "However, Johnson argues..."

### Cross-Disciplinary Agent
**Sources**: Related fields, Adjacent research  
**Focus**: Broader context  
**Output**: Interdisciplinary insights  
**Example**: "Similar patterns in NLP research..."

## 📊 Confidence Scoring System

### Per-Claim Scoring
```javascript
{
  claim: "Statement",
  confidence: 85,        // 0-100
  sources: 12,           // Number of sources
  reliability: "high",   // high/medium/low
  bias: "low",           // low/medium/high
  temporal: "recent"     // recent/stale/outdated
}
```

### Overall Score Calculation
```javascript
// Weighted average
overall = (
  (avgConfidence * 0.4) +
  (sourceCount * 0.2) +
  (reliabilityScore * 0.2) +
  (biasScore * 0.1) +
  (temporalScore * 0.1)
)
```

## 🎯 Bias Detection

### Source Credibility
```javascript
{
  peerReviewed: true/false,
  citations: number,
  funding: "independent"|"corporate"|"government",
  authorReputation: "high"|"medium"|"low",
  publicationVenue: "top-tier"|"mid-tier"|"unknown"
}
```

### Temporal Relevance
```javascript
// Score based on publication date
score = {
  "2026": 100,
  "2025": 90,
  "2024": 75,
  "2023": 50,
  "pre-2023": 25
}
```

### Conflict of Interest
```javascript
// Check for corporate bias
if (funding === "corporate" && 
    claimsBenefit === true) {
  biasScore += 20;
}
```

## 📝 Report Structure

```markdown
# Research Report: [Topic]

## Executive Summary
[4-line summary]

## Hypothesis
[Statement]

## Methodology
- 5 parallel agents
- 3-phase verification
- Confidence scoring
- Bias detection

## Key Findings
1. [Finding 1] (Confidence: 85%)
2. [Finding 2] (Confidence: 92%)
3. [Finding 3] (Confidence: 78%)

## Limitations
- [Limitation 1]
- [Limitation 2]

## Future Research
- [Direction 1]
- [Direction 2]

## Sources
[All sources with credibility scores]
```

## 🔧 Integration with Other Frameworks

### Research + Amp
- Research: Deep analysis
- Amp: Concise summary
- Result: Thorough + digestible

### Research + Devin
- Research: Evidence gathering
- Devin: LSP verification
- Result: Academic + practical

### Research + Manus
- Research: Multi-phase
- Manus: Event tracking
- Result: Traceable research

### Research + Ralph-Loop
- Research: Any topic
- Ralph: Uncensored
- Result: No topic restrictions

## ⚡ Quick Commands

| Command | Description |
|---------|-------------|
| "Research X with PhD methodology" | Full research |
| "Test hypothesis: X" | Hypothesis testing |
| "Academic sources on X" | Academic only |
| "Counter-evidence for X" | Opposing views |
| "Cross-disciplinary X" | Related fields |

## 🎯 Best Practices

1. **Always** start with hypothesis
2. **Use** all 5 agents
3. **Verify** in 3 phases
4. **Score** everything
5. **Detect** biases

## 📊 Success Metrics

| Metric | Target | Achievement |
|--------|--------|-------------|
| Source Count | >50 | ✅ |
| Agent Coverage | 5/5 | ✅ |
| Confidence Score | >80% | ✅ |
| Bias Detection | 100% | ✅ |
| Report Quality | PhD-level | ✅ |

## 📚 Reference

- **Source**: Custom implementation
- **Methodology**: PhD-level research
- **Pattern**: Hypothesis-driven + multi-agent
- **Integration**: Full Claude Code support

---

**Next**: See [Conductor Track Guide](conductor-track-guide.md) for workflow orchestration