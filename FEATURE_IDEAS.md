# Feature Ideas

Future enhancements and ideas for the Scene Moderator Agent. These are captured for consideration during PRD evolution.

---

## Character Quality Evaluation

### Character Definition Evaluator

**Purpose:** Validate character definitions before use in scenes

**Description:**
An evaluation agent that analyzes character definition files (`.claude/agents/*.md`) to ensure they're rich enough for authentic scene performance.

**Evaluation Criteria:**
- **Depth Check:** Is character personality multi-dimensional, not flat/stereotypical?
- **Communication Style:** Does character have clear communication patterns?
- **Emotional Range:** Are emotional responses well-defined?
- **Relationships:** Are relationships with other characters documented?
- **Background:** Is there sufficient context for character decisions?

**Format Validation:**
- Response format understanding (bracket notation, tone, target, etc.)
- Awareness of interruption capability
- Understanding of non-verbal communication options
- Awareness that silence is valid

**Implementation Notes:**
- Run before scene initialization
- Provide actionable feedback: "Add more detail about how Alice responds when frustrated"
- Could be optional (warn) or required (block)
- Evaluation criteria should be versioned with PRD

**Evolving Capabilities List:**
As we discover new organic interaction patterns, this list grows:
- Directed speech (`TO: name`)
- Interruptions (`INTERRUPT after "phrase"`)
- Non-verbal reactions (`*action description*`)
- Silent observation (`[SILENT]`)
- Tone expression (`TONE: emotion`)
- Mixed verbal/non-verbal (`[TONE: sad, *looks down*] "I'm sorry"`)
- Future: Simultaneous actions, environmental interaction, etc.

**PRD Integration:**
- Store canonical "Capabilities List" in PRD (perhaps `architecture/character-capabilities.md`)
- Reference this list in character definition template
- Update evaluator when capabilities evolve

---

## Scene Quality Evaluation Agents

Suite of specialized agents that evaluate completed scenes using industry best practices from film, television, and live theater.

### 1. Narrative Prose Synthesis Agent

**Purpose:** Evaluate scene's narrative quality and prose effectiveness

**Based on:**
- Literary fiction writing standards
- Screenwriting narrative techniques
- "Show don't tell" principles
- Subtext and implication

**Evaluates:**
- Dialog naturalness and authenticity
- Balance of dialog vs. action
- Pacing within individual exchanges
- Use of subtext and implication
- Character voice distinctiveness
- Readability and flow

**Output:**
- Score (1-10) with rationale
- Specific examples of strong/weak moments
- Suggestions for improvement
- Comparison to professional screenplay standards

---

### 2. Elite Narrative Pacing Agent

**Purpose:** Analyze scene pacing and rhythm

**Based on:**
- Three-act structure principles
- Beat sheet analysis (Save the Cat, Story Circle, etc.)
- Scene-level pacing from theater direction
- Tension/release patterns
- Dramatic timing

**Evaluates:**
- Scene length appropriate for content
- Tension escalation/de-escalation
- Beat variety (fast exchanges vs. slower moments)
- Momentum toward scene goal
- Natural pauses and silence
- Rhythm and flow

**Output:**
- Pacing graph (tension over time)
- Identification of rushed/dragging moments
- Suggestions for tightening or expanding
- Comparison to target scene length

---

### 3. Emotional Impact AI Agent

**Purpose:** Measure scene's emotional resonance and authenticity

**Based on:**
- Method acting emotional authenticity
- Audience engagement research
- Emotional arc theory
- Character psychology

**Evaluates:**
- Emotional authenticity of character responses
- Emotional trajectory (where characters start/end)
- Moments of genuine emotional impact
- Consistency with character emotional patterns
- Reader/viewer emotional engagement
- Catharsis or emotional payoff

**Output:**
- Emotional journey map for each character
- Identification of powerful emotional beats
- Flag inconsistent emotional responses
- Suggestions for deepening impact

---

### 4. Story Continuity AI Agent

**Purpose:** Ensure scene consistency with story context and character history

**Based on:**
- Script supervision practices
- Story bible management
- Character arc tracking
- Continuity editing standards

**Evaluates:**
- Character behavior consistent with established personality
- References to past events make sense
- Character relationships evolve logically
- No contradictions with scene goals or story context
- Props/environment references consistent
- Timeline coherence

**Output:**
- Continuity report (pass/fail on various checks)
- Flagged inconsistencies with specific line numbers
- Character arc progression notes
- Suggestions for maintaining continuity

---

## Implementation Considerations

### Subagent vs. External Tool

**Option A: Evaluation Subagents (Preferred)**
- Live within moderator agent
- Run automatically after scene completion
- Can be toggled on/off via config
- Results included in scene metadata

**Option B: Separate CLI Tool**
- Standalone evaluation script
- Processes existing transcripts
- Could be run independently for analysis

### Evaluation Workflow

```
Scene Complete
    ↓
[Optional] Run Evaluation Suite
    ↓
Parallel execution:
- Narrative Prose Synthesis → score + feedback
- Elite Narrative Pacing → pacing analysis
- Emotional Impact → emotional journey
- Story Continuity → consistency check
    ↓
Aggregate Results
    ↓
Write to: /data/scenes/[name]/evaluation-report.md
```

### Configuration

```typescript
interface SceneConfig {
  // ... existing fields
  evaluation?: {
    enabled: boolean;
    agents: ('prose' | 'pacing' | 'emotional' | 'continuity')[];
    failOnLowScore?: number; // e.g., reject scene if score < 6
  };
}
```

### Prompts

Each evaluation agent needs:
- Deep research prompt (industry best practices)
- Specific evaluation rubric
- Output format specification
- Examples of good/bad scenes

These prompts should be:
- Stored in `/development/prompts/evaluation/`
- Versioned with the PRD
- Referenced in feature specifications when implemented

---

## Future Enhancements (Brainstorm)

- **Multi-scene analysis:** Track character development across multiple scenes
- **Style matching:** Evaluate scene against target style (Tarantino, Sorkin, etc.)
- **Genre conventions:** Check scene meets genre expectations (thriller pacing, rom-com beats)
- **Dialogue balance:** Ensure no character dominates unfairly
- **Accessibility evaluation:** Check readability for various audiences
- **Translation readiness:** Evaluate how well scene would translate to other languages

---

## Notes

- These are **ideas**, not committed features
- Each idea should move to proper PRD feature specification when prioritized
- Keep this file as low-friction capture — refine ideas before PRD integration
- Review this list during PRD updates to see what's ready to formalize

---

*Last updated: 2025-10-03*
*Add new ideas as they emerge, organize when patterns form*
