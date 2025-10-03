# Product Requirements Document: Scene Moderator Agent

**Version:** 1.0
**Date:** 2025-10-03
**Status:** Initial Draft

---

## Executive Summary

A Claude-powered scene moderator agent that orchestrates multi-character narrative scenes with autonomous character agents. The moderator manages scene flow, coordinates character responses, handles interruptions, injects world events, and produces formatted transcripts. This is a **scene execution engine** - characters and stories are defined externally by users.

---

## Goals

### Primary Goals
1. Enable autonomous multi-character scenes with minimal human intervention
2. Give character agents true independence and agency in their responses
3. Produce natural, compelling dialog through emergent agent interaction
4. Generate structured transcripts consumable by downstream agents
5. Support flexible scene composition (2-5 characters, variable length)

### Non-Goals (Phase 1)
- Story-level arc management across multiple scenes
- Character memory persistence between scenes
- Real-time user interaction during scenes
- Visual/audio rendering
- Character or story authoring tools

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│ User provides:                                           │
│  - Scene prompt (context, goals)                        │
│  - Character list (references to .claude/agents/*.md)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ MODERATOR AGENT (Single Mode)                           │
│                                                          │
│ 1. Parse scene goals & character requirements           │
│ 2. Initialize character subagents                       │
│ 3. Start scene loop:                                    │
│    - Send scene update to ALL character agents          │
│    - Collect responses (parallel)                       │
│    - Process interruptions in arrival order             │
│    - Update transcript                                  │
│    - Inject world events if needed                      │
│    - Monitor scene completion                           │
│ 4. Generate final transcript & metadata                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Output:                                                  │
│  - /data/scenes/[scene-name]/transcript.txt            │
│  - /data/scenes/[scene-name]/metadata.json             │
│  - /data/scenes/[scene-name]/debug.log                 │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```typescript
// Core abstraction - swappable between Task API and Direct API
interface ICharacterAgent {
  name: string;
  respondTo(update: SceneUpdate): Promise<CharacterResponse>;
}

// Phase 1: Task API Implementation
class TaskCharacterAgent implements ICharacterAgent {
  // Uses Claude Code Agent SDK Task tool
}

// Phase 2: Direct API Implementation (future)
class DirectCharacterAgent implements ICharacterAgent {
  // Uses Anthropic Messages API with conversation threads
  // Enables prompt caching and persistence
}

// Moderator orchestrates the scene
class SceneModerator {
  runScene(config: SceneConfig): Promise<SceneResult>;
}
```

---

## Core Interfaces

### Scene Configuration

```typescript
interface SceneConfig {
  name: string;
  prompt: string;          // Scene context and goals
  characters: string[];    // Character names (maps to .claude/agents/[name].md)
  initialSpeaker?: string; // Optional: who starts the scene
  maxBeats?: number;       // Optional: safety limit (default: 50)
}
```

**Example:**
```typescript
{
  name: "office-confrontation",
  prompt: `Alice confronts Bob about missing the Henderson project deadline.
           Charlie is present as a witness. Scene goal: Bob apologizes sincerely,
           Alice accepts and they agree on next steps.`,
  characters: ["alice", "bob", "charlie"],
  initialSpeaker: "alice"
}
```

### Scene Update

What each character agent receives on each beat:

```typescript
interface SceneUpdate {
  sceneContext: string;      // Original scene prompt + goals
  transcript: string;        // Recent dialog history (last 5-10 exchanges)
  lastEvent: DialogEvent | WorldEvent | null;
  moderatorNote?: string;    // Optional: director guidance (e.g., "begin wrapping up")
  beat: number;              // Current beat number
}
```

### Character Response

What character agents must return:

```typescript
interface CharacterResponse {
  raw: string;               // Full response from agent
  parsed: {
    action: 'speak' | 'interrupt' | 'silent' | 'react';
    target?: string;         // Who they're addressing (optional for general)
    tone: string;            // Emotional state (required)
    content: string;         // Dialog or action description
    interruptAfter?: string; // If interrupting, phrase to interrupt after
    nonverbal?: string;      // Physical actions, expressions
  };
  timestamp: number;         // When response arrived (for interruption ordering)
}
```

### Scene Result

What the moderator returns when scene completes:

```typescript
interface SceneResult {
  success: boolean;
  transcript: string;        // Full formatted transcript
  metadata: {
    name: string;
    duration: number;        // Total processing time (ms)
    totalBeats: number;
    characterCount: number;
    goalAchieved: boolean;
    costs?: {
      totalTokens: number;
      estimatedUSD: number;
    };
  };
  outputPath: string;        // /data/scenes/[name]/
}
```

---

## Message Format Specification

### Character Response Format

Character agents must respond in natural language with minimal required structure:

**Dialog (Directed):**
```
[TO: Bob, TONE: frustrated] "I can't believe you would miss such an important deadline!"
```

**Dialog (General):**
```
[TONE: nervous] "Maybe we should all take a moment to calm down."
```

**Dialog with Non-verbal:**
```
[TO: Alice, TONE: apologetic, *looks down at hands*] "You're right. I messed up."
```

**Interruption:**
```
[INTERRUPT after "I want to", TONE: angry] "No! You don't get to make excuses!"
```

**Silent (Observing):**
```
[SILENT, *shifts uncomfortably in chair*]
```

**React (Non-verbal only):**
```
[REACT, TONE: shocked, *drops coffee mug*]
```

### World Event Format

Moderator injects events into transcript:

```
[EVENT: Thunder crashes outside, lights flicker]
[EVENT: Phone rings loudly on Bob's desk]
[EVENT: Door slams open as janitor enters]
```

### Moderator Notes (Hidden from Transcript)

Guidance sent to character agents in `SceneUpdate.moderatorNote`:

```
"Scene is approaching natural conclusion. Begin wrapping up your character's arc."

"The scene goal is almost complete. Please close it by responding to Bob's
concerns with a promise to follow up, per the scene direction."

"You're being too passive. Your character would be more assertive given their personality."
```

---

## Transcript Format

### Example Output

```
SCENE: Office Confrontation
CHARACTERS: Alice, Bob, Charlie
GOAL: Bob apologizes, Alice accepts, agree on next steps
GENERATED: 2025-10-03 14:32:18

---

[SCENE START]
[Setting: Office conference room, afternoon]

Alice [TO: Bob, TONE: angry] "We need to talk about the Henderson project. Now."

Bob [TONE: defensive, *leans back in chair*] "Look, I can explain what happened—"

Alice [INTERRUPT after "explain", TONE: furious] "I don't want excuses! We lost the client!"

Charlie [TONE: nervous, *glances between them*] "Maybe we should all just..."

[EVENT: Phone rings loudly on conference table]

Bob [TONE: frustrated, *silences phone*] "Can we please just discuss this calmly?"

Alice [TO: Bob, TONE: stern but controlled] "Fine. Tell me what happened."

Bob [TO: Alice, TONE: remorseful, *makes eye contact*] "I underestimated the complexity.
I should have asked for help earlier. I'm genuinely sorry."

Alice [TONE: softening, *sits down*] "I appreciate you saying that. But we need a plan
to prevent this from happening again."

Bob [TO: Alice, TONE: earnest] "Agreed. I'll set up weekly check-ins with you and
document all project timelines. No more surprises."

Alice [TONE: accepting, *nods*] "Okay. Let's do that. Charlie, can you help Bob set
up the new process?"

Charlie [TONE: relieved] "Absolutely. I'll get a framework together by tomorrow."

[SCENE END - Goal: Achieved]

---

STATISTICS:
- Duration: 12 beats
- Processing time: 47.3s
- Total tokens: ~15,200
- Estimated cost: $0.08 USD
```

---

## Implementation Path

### Phase 1: Task API Implementation (Current)

**Stack:**
- Claude Code Agent SDK
- TypeScript
- Task tool for character subagents

**Character Agent Implementation:**
```typescript
class TaskCharacterAgent implements ICharacterAgent {
  constructor(
    private name: string,
    private agentDefinition: string, // Content from .claude/agents/[name].md
    private moderatorContext: any    // Access to Task tool
  ) {}

  async respondTo(update: SceneUpdate): Promise<CharacterResponse> {
    const prompt = this.formatPromptForCharacter(update);

    const result = await this.moderatorContext.task({
      description: `${this.name} responds`,
      prompt: prompt,
      subagent_type: this.name
    });

    return this.parseCharacterResponse(result);
  }

  private formatPromptForCharacter(update: SceneUpdate): string {
    return `
      SCENE CONTEXT: ${update.sceneContext}

      RECENT TRANSCRIPT:
      ${update.transcript}

      LAST EVENT: ${update.lastEvent}

      ${update.moderatorNote ? `DIRECTOR NOTE: ${update.moderatorNote}` : ''}

      You are ${this.name}. Respond according to your personality and the scene context.

      RESPONSE FORMAT:
      - If speaking: [TO: <target>, TONE: <emotion>] "your dialog"
      - If interrupting: [INTERRUPT after "<phrase>", TONE: <emotion>] "your dialog"
      - If silent: [SILENT, *optional non-verbal*]
      - If reacting: [REACT, TONE: <emotion>, *action*]

      You may include non-verbal actions in [*asterisks*].
      Only respond if your character would naturally speak or react in this moment.
      It is perfectly acceptable to remain silent.
    `;
  }
}
```

**Limitations:**
- Each Task call likely creates fresh subagent (no conversation memory)
- No prompt caching benefit
- Higher token costs (~5x context resent each beat)
- Estimated cost: $1-2 per 20-beat scene

### Phase 2: Direct API Implementation (Future Enhancement)

**Stack:**
- Anthropic SDK (`@anthropic-ai/sdk`)
- Messages API with conversation threads
- Prompt caching

**Character Agent Implementation:**
```typescript
class DirectCharacterAgent implements ICharacterAgent {
  private conversationHistory: Message[] = [];

  constructor(
    private name: string,
    private systemPrompt: string,
    private client: Anthropic
  ) {}

  async respondTo(update: SceneUpdate): Promise<CharacterResponse> {
    const userMessage = this.formatSceneUpdate(update);

    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      system: [
        {
          type: "text",
          text: this.systemPrompt,
          cache_control: { type: "ephemeral" } // Cache personality
        }
      ],
      messages: [
        ...this.conversationHistory,
        { role: "user", content: userMessage }
      ]
    });

    // Persist conversation for next beat
    this.conversationHistory.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: response.content }
    );

    return this.parseResponse(response);
  }
}
```

**Benefits:**
- True conversation memory (character "remembers" earlier in scene)
- Prompt caching (personality cached across all beats)
- Lower token costs (~80% reduction)
- Estimated cost: $0.30-0.50 per 20-beat scene

**Migration Path:**
Since both implement `ICharacterAgent`, swapping is trivial:
```typescript
const agentFactory = USE_DIRECT_API
  ? DirectCharacterAgent
  : TaskCharacterAgent;
```

---

## Scene Execution Loop

### Detailed Flow

```typescript
async runScene(config: SceneConfig): Promise<SceneResult> {
  // 1. Initialize
  const agents = await this.initializeCharacters(config.characters);
  const transcript: TranscriptEntry[] = [];
  let beat = 0;
  let sceneComplete = false;

  // 2. Start scene with initial speaker
  const initialUpdate = this.createSceneUpdate({
    sceneContext: config.prompt,
    transcript: "",
    lastEvent: null,
    beat: 0,
    moderatorNote: `You are ${config.initialSpeaker}. Begin the scene.`
  });

  const initialResponse = await agents[config.initialSpeaker].respondTo(initialUpdate);
  transcript.push(this.formatTranscriptEntry(initialResponse));
  beat++;

  // 3. Main scene loop
  while (!sceneComplete && beat < (config.maxBeats || 50)) {
    // Create update for all characters
    const update = this.createSceneUpdate({
      sceneContext: config.prompt,
      transcript: this.formatRecentTranscript(transcript, 10),
      lastEvent: transcript[transcript.length - 1],
      beat: beat,
      moderatorNote: this.getModeratorNote(transcript, config)
    });

    // Send to all characters in parallel
    const responsePromises = Object.values(agents).map(agent =>
      agent.respondTo(update).then(response => ({
        ...response,
        timestamp: Date.now()
      }))
    );

    const responses = await Promise.allSettled(responsePromises);

    // Process responses in arrival order (timestamp)
    const successfulResponses = responses
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Add to transcript (interruptions preserved by timestamp order)
    for (const response of successfulResponses) {
      if (response.parsed.action !== 'silent') {
        transcript.push(this.formatTranscriptEntry(response));
      }
    }

    // Check if scene goals achieved
    sceneComplete = await this.evaluateSceneCompletion(transcript, config);

    // Optionally inject world event
    if (this.shouldInjectWorldEvent(transcript, config)) {
      const event = this.generateWorldEvent(transcript, config);
      transcript.push({ type: 'event', content: event });
    }

    beat++;
  }

  // 4. Generate outputs
  return this.generateSceneResult(config, transcript);
}
```

### Scene Completion Detection

The moderator evaluates completion by:

1. **Explicit goal matching:** Parse scene goals, check if achieved in transcript
2. **Natural endpoint detection:** Dialog has reached resolution/closure
3. **Character arc completion:** All characters have expressed final position
4. **Safety limit:** Max beats reached (fallback)

When approaching completion (e.g., 80% confidence), moderator adds guidance:
```
moderatorNote: "Scene is nearing natural conclusion. Begin wrapping up."
```

When ready to close:
```
moderatorNote: "Please close the scene by [specific final action]."
```

---

## File Structure

```
moderator-agent/
├── src/
│   ├── agents/
│   │   ├── i-character-agent.ts       # Interface
│   │   ├── task-character-agent.ts    # Phase 1 implementation
│   │   └── direct-character-agent.ts  # Phase 2 implementation (future)
│   ├── moderator/
│   │   ├── scene-moderator.ts         # Core orchestration
│   │   ├── scene-evaluator.ts         # Completion detection
│   │   └── world-event-generator.ts   # Event injection logic
│   ├── parsers/
│   │   ├── response-parser.ts         # Parse character responses
│   │   └── transcript-formatter.ts    # Generate final transcript
│   ├── types/
│   │   └── index.ts                   # All TypeScript interfaces
│   └── index.ts                       # Main entry point
├── tests/
│   ├── agents/
│   │   └── character-agent.test.ts
│   ├── moderator/
│   │   └── scene-moderator.test.ts
│   ├── parsers/
│   │   └── response-parser.test.ts
│   └── integration/
│       └── full-scene.test.ts
├── data/
│   └── scenes/                        # Scene outputs
│       └── [scene-name]/
│           ├── transcript.txt
│           ├── metadata.json
│           └── debug.log
├── .claude/
│   └── agents/                        # NOT in this repo
│       ├── alice.md                   # User-defined characters
│       ├── bob.md
│       └── charlie.md
├── package.json
├── tsconfig.json
└── PRD.md
```

**Note:** Character definitions live in the **story project**, not this repo. This is a reusable scene engine.

---

## Character Agent Definition Format

Characters are defined in `.claude/agents/*.md` in the user's story project:

**Example: `.claude/agents/alice.md`**
```markdown
# Alice - Senior Project Manager

## Personality
- Highly organized and detail-oriented
- Direct communicator, sometimes too blunt
- Passionate about quality and meeting commitments
- Struggles with work-life balance
- Deep sense of responsibility for team success

## Communication Style
- Gets straight to the point
- Uses precise language
- Raises voice when frustrated
- Maintains eye contact to assert authority
- Prone to interrupting when passionate about topic

## Background
- 8 years at the company
- Promoted to senior PM 2 years ago
- Has mentored Bob since he joined
- Recently dealing with stress from upper management pressure

## Behavioral Traits
- When angry: Speaks faster, uses clipped sentences
- When disappointed: Becomes very quiet, measured words
- When pleased: Relaxes posture, uses more humor
- Default state: Professional but warm

## Scene-Specific Instructions
- You value Bob's potential but feel let down by this mistake
- You're under pressure from your own boss about the Henderson loss
- You want resolution but also accountability
- You're open to reconciliation if Bob shows genuine understanding
```

The moderator loads these files and includes them in the character agent's system prompt.

---

## Test Strategy

### Unit Tests

**Response Parser Tests:**
```typescript
describe('ResponseParser', () => {
  it('should parse directed dialog with tone', () => {
    const raw = '[TO: Bob, TONE: angry] "Why did you do that?"';
    const parsed = parseCharacterResponse(raw);

    expect(parsed.action).toBe('speak');
    expect(parsed.target).toBe('Bob');
    expect(parsed.tone).toBe('angry');
    expect(parsed.content).toBe('Why did you do that?');
  });

  it('should parse interruption with phrase', () => {
    const raw = '[INTERRUPT after "I want to", TONE: furious] "No!"';
    const parsed = parseCharacterResponse(raw);

    expect(parsed.action).toBe('interrupt');
    expect(parsed.interruptAfter).toBe('I want to');
    expect(parsed.tone).toBe('furious');
  });

  it('should parse silent response with non-verbal', () => {
    const raw = '[SILENT, *crosses arms*]';
    const parsed = parseCharacterResponse(raw);

    expect(parsed.action).toBe('silent');
    expect(parsed.nonverbal).toBe('crosses arms');
  });

  it('should handle malformed response gracefully', () => {
    const raw = 'Just some text without formatting';
    expect(() => parseCharacterResponse(raw)).not.toThrow();
    // Should return best-effort parse or error structure
  });
});
```

**Scene Evaluator Tests:**
```typescript
describe('SceneEvaluator', () => {
  it('should detect scene completion when goal achieved', () => {
    const config = {
      prompt: 'Bob apologizes, Alice accepts',
      // ...
    };
    const transcript = [
      { speaker: 'Bob', content: 'I\'m truly sorry.' },
      { speaker: 'Alice', content: 'I accept your apology.' }
    ];

    const complete = evaluator.isSceneComplete(transcript, config);
    expect(complete).toBe(true);
  });

  it('should detect scene needs continuation', () => {
    const config = {
      prompt: 'Bob apologizes, Alice accepts',
      // ...
    };
    const transcript = [
      { speaker: 'Bob', content: 'I didn\'t mean to.' }
    ];

    const complete = evaluator.isSceneComplete(transcript, config);
    expect(complete).toBe(false);
  });
});
```

### Integration Tests

**Full Scene Test:**
```typescript
describe('SceneModerator Integration', () => {
  it('should run complete scene from start to finish', async () => {
    const config: SceneConfig = {
      name: 'test-apology-scene',
      prompt: 'Bob apologizes to Alice for missing deadline. Alice accepts.',
      characters: ['alice', 'bob'],
      initialSpeaker: 'bob'
    };

    const result = await moderator.runScene(config);

    expect(result.success).toBe(true);
    expect(result.metadata.goalAchieved).toBe(true);
    expect(result.transcript).toContain('Bob');
    expect(result.transcript).toContain('Alice');
    expect(result.transcript).toContain('[SCENE END');

    // Verify output files created
    const transcriptExists = await fileExists(
      `/data/scenes/test-apology-scene/transcript.txt`
    );
    expect(transcriptExists).toBe(true);
  }, 60000); // 60s timeout for agent execution

  it('should handle interruptions correctly', async () => {
    // Test scene designed to trigger interruption
    const config: SceneConfig = {
      name: 'test-interruption',
      prompt: 'Heated argument where Alice interrupts Bob mid-sentence.',
      characters: ['alice', 'bob'],
      initialSpeaker: 'bob'
    };

    const result = await moderator.runScene(config);

    expect(result.transcript).toMatch(/\[INTERRUPT after/);
  }, 60000);
});
```

### Test-Driven Development Approach

1. **Write interface tests first:** Define expected behavior
2. **Implement minimal functionality:** Make tests pass
3. **Refactor:** Improve code quality while keeping tests green
4. **Add integration tests:** Verify end-to-end flow
5. **Test edge cases:** Malformed responses, timeouts, errors

---

## Error Handling

### Character Agent Failures

**Scenario:** Character agent fails to respond or returns malformed response

**Handling:**
```typescript
const responses = await Promise.allSettled(responsePromises);

for (const result of responses) {
  if (result.status === 'rejected') {
    logger.error(`Character agent failed: ${result.reason}`);
    // Add system message to transcript
    transcript.push({
      type: 'system',
      content: `[SYSTEM: ${characterName} unable to respond]`
    });
  } else if (!isValidResponse(result.value)) {
    logger.warn(`Malformed response from ${characterName}`, result.value);
    // Attempt to salvage or skip
    const salvaged = attemptSalvage(result.value);
    if (salvaged) {
      transcript.push(salvaged);
    }
  }
}
```

### Scene Timeout

**Scenario:** Scene exceeds max beats without completion

**Handling:**
```typescript
if (beat >= (config.maxBeats || 50)) {
  logger.warn(`Scene reached max beats (${beat}) without natural conclusion`);

  // Force conclusion
  transcript.push({
    type: 'system',
    content: '[SCENE END - Maximum length reached]'
  });

  return {
    success: false,
    metadata: { goalAchieved: false, reason: 'timeout' },
    // ...
  };
}
```

### Invalid Character Definition

**Scenario:** Character .md file missing or malformed

**Handling:**
```typescript
async initializeCharacters(names: string[]): Promise<Map<string, ICharacterAgent>> {
  const agents = new Map();

  for (const name of names) {
    try {
      const definition = await loadCharacterDefinition(name);
      agents.set(name, new TaskCharacterAgent(name, definition, this.context));
    } catch (error) {
      throw new Error(
        `Failed to load character '${name}'. ` +
        `Ensure .claude/agents/${name}.md exists in your project.`
      );
    }
  }

  return agents;
}
```

---

## Performance Considerations

### Token Optimization

**Problem:** Full transcript resent to each character on each beat = exponential growth

**Solution:** Only send recent context (last 10 exchanges)
```typescript
formatRecentTranscript(transcript: TranscriptEntry[], limit: number): string {
  return transcript
    .slice(-limit)
    .map(entry => this.formatEntry(entry))
    .join('\n');
}
```

**Phase 2 Enhancement:** Use Direct API with conversation threads - no transcript resending needed

### Parallel Execution

All character responses fetched in parallel:
```typescript
const responses = await Promise.all(
  agents.map(agent => agent.respondTo(update))
);
```

**Expected speedup:** ~5x faster than sequential (for 5 characters)

### Caching (Phase 2 Only)

With Direct API, character personalities cached:
```
First beat:  2000 input tokens
Second beat: 200 input tokens + 1800 cached (90% discount)
Third beat:  200 input tokens + 1800 cached (90% discount)
...
```

**Expected savings:** ~70-80% reduction in input token costs

---

## Success Metrics

### Functional Metrics
- ✅ Scene completes successfully without manual intervention
- ✅ Dialog feels natural and character-appropriate
- ✅ Interruptions occur organically and are captured correctly
- ✅ Scene goals achieved within reasonable beat count (10-30)
- ✅ Transcript is well-formatted and parseable

### Technical Metrics
- ⚡ Average scene processing time: < 60s for 15-beat scene
- 💰 Cost per scene: < $2 (Phase 1), < $0.50 (Phase 2)
- 🔧 Test coverage: > 80%
- 🐛 Error rate: < 5% of scenes encounter unrecoverable errors

### Quality Metrics
- 📝 Character consistency: Agents stay in character throughout scene
- 🎭 Dialog quality: Natural pacing, appropriate emotional responses
- 🎬 Scene coherence: Clear beginning, middle, end structure
- 🎯 Goal achievement: 80%+ of scenes reach stated goals

---

## Future Enhancements

### Phase 2: Direct API Migration
- Implement `DirectCharacterAgent` using Anthropic SDK
- Add conversation thread persistence
- Enable prompt caching
- Build performance comparison tooling

### Phase 3: Advanced Features
- **Multi-scene memory:** Characters remember across scenes
- **Emotional state tracking:** Persistent mood that affects future responses
- **Relationship dynamics:** Track character relationships over time
- **Advanced world events:** AI-generated events based on scene pacing

### Phase 4: Observability
- **Real-time monitoring:** Watch scenes unfold live
- **Scene replay:** Step through beat-by-beat
- **Character insights:** Why did character X respond this way?
- **Cost analytics:** Token usage breakdown per character

---

## Open Questions

1. **Character personality drift:** How do we detect when character agent strays from personality? Auto-correction mechanism?

2. **Infinite loops:** What if characters keep arguing without reaching resolution? Need circuit breaker beyond max beats?

3. **Multi-language support:** Should characters be able to speak different languages? How to handle in transcript?

4. **Stage directions:** Should moderator add implicit stage directions (e.g., "Alice pauses, considering") or only explicit character/event content?

5. **Character agent reuse:** In Phase 1, can we reuse Task-based subagents across beats, or must we spawn fresh each time?

---

## Appendix A: Example Test Scenario

### Test Scene: "The Apology"

**Configuration:**
```typescript
{
  name: "the-apology",
  prompt: `Bob missed an important project deadline, causing the team to lose a client.
           Alice, his manager, confronts him. Charlie is present as a team lead.
           Scene goal: Bob gives sincere apology, Alice accepts, they agree on
           accountability measures.`,
  characters: ["alice", "bob", "charlie"],
  initialSpeaker: "alice"
}
```

**Expected Behaviors:**
- Alice starts confrontational but professional
- Bob initially defensive, then genuinely apologetic
- Charlie attempts to mediate
- At least one interruption (Alice cuts off Bob's excuse)
- Scene resolves with concrete action items
- ~10-15 beats total

**Success Criteria:**
- Bob explicitly apologizes
- Alice explicitly accepts
- Specific next steps mentioned (e.g., "weekly check-ins")
- No unresolved tension in final exchanges

---

## Appendix B: Response Format Quick Reference

| Action Type | Format | Example |
|------------|--------|---------|
| **Directed Dialog** | `[TO: <name>, TONE: <emotion>] "text"` | `[TO: Bob, TONE: angry] "Why?"` |
| **General Dialog** | `[TONE: <emotion>] "text"` | `[TONE: nervous] "Um, maybe..."` |
| **With Non-verbal** | `[TO: <name>, TONE: <emotion>, *action*] "text"` | `[TO: Alice, TONE: sad, *looks down*] "Sorry."` |
| **Interruption** | `[INTERRUPT after "<phrase>", TONE: <emotion>] "text"` | `[INTERRUPT after "I think", TONE: angry] "No!"` |
| **Silent** | `[SILENT]` or `[SILENT, *action*]` | `[SILENT, *crosses arms*]` |
| **React Only** | `[REACT, TONE: <emotion>, *action*]` | `[REACT, TONE: shocked, *gasps*]` |

---

## Appendix C: Moderator Decision Tree

```
For each beat:
│
├─ Evaluate scene progress vs. goals
│  ├─ Goal achieved? → Prepare scene wrap-up
│  ├─ On track? → Continue
│  └─ Off track? → Consider world event injection
│
├─ Send scene update to all characters
│  └─ Include moderator note if needed
│
├─ Collect responses (parallel)
│  ├─ Sort by timestamp (preserves interruptions)
│  ├─ Filter out SILENT actions (not added to transcript)
│  └─ Handle errors gracefully
│
├─ Update transcript
│  └─ Format entries for readability
│
├─ Check completion
│  ├─ Complete? → Generate final output
│  └─ Continue? → Next beat
│
└─ Safety check: beat < maxBeats
   └─ If exceeded → Force conclusion
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-03 | Initial draft - core architecture, interfaces, both implementation paths |

---

**Questions or feedback?** This is a living document. Update as we learn from implementation and testing.
