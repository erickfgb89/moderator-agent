# AI Implementation Guidelines

Instructions for Claude Code when implementing features from this PRD.

---

## Before Starting Any Feature

### 1. Load Context

Always load these files first:
- `core/design-principles.md`
- `core/constraints.md`
- Feature's `specification.md`
- Feature's `acceptance.md`
- Feature's `interfaces.md` (if exists)
- `architecture/data-model.md`

### 2. Understand the Goal

Ask yourself:
- What problem does this feature solve?
- How does it fit into the larger system?
- What are the acceptance criteria?
- What are the edge cases?

### 3. Confirm Approach

Before writing code, propose:
- Overall implementation strategy
- Key functions and their signatures
- Test cases you'll write first
- Any deviations from spec (with justification)

---

## Test-First Development

### Workflow

**Always follow this sequence:**

1. **Write failing tests** based on acceptance criteria
2. **Run tests** to confirm they fail
3. **Implement** minimum code to pass tests
4. **Run tests** to confirm they pass
5. **Refactor** while keeping tests green
6. **Repeat** for next test case

### Test Structure

```typescript
// feature-name.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { featureName } from './feature-name';

describe('featureName', () => {
  // Happy path first
  describe('happy path', () => {
    it('should handle typical input correctly', () => {
      const result = featureName(validInput);
      expect(result).toMatchObject(expectedOutput);
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle empty input', () => {
      // ...
    });

    it('should handle boundary condition', () => {
      // ...
    });
  });

  // Error conditions
  describe('error handling', () => {
    it('should fail gracefully on invalid input', () => {
      expect(() => featureName(invalidInput)).not.toThrow();
      // or
      expect(featureName(invalidInput).success).toBe(false);
    });
  });
});
```

### Coverage Goals

- **Critical paths:** 100% coverage (parsers, moderator loop)
- **Supporting code:** 80%+ coverage
- **Integration tests:** Cover full happy path + major error scenarios

---

## Code Style

### Functional Principles

**Prefer:**
```typescript
// ✅ Pure function
function addToTranscript(transcript: Entry[], entry: Entry): Entry[] {
  return [...transcript, entry];
}

// ✅ Immutable data
const updated = { ...config, maxBeats: 30 };

// ✅ Explicit data flow
const parsed = parse(raw);
const validated = validate(parsed);
const formatted = format(validated);
```

**Avoid:**
```typescript
// ❌ Mutation
transcript.push(entry);

// ❌ Side effects in functions
function process(data) {
  fs.writeFileSync('out.txt', data); // Side effect
  return data;
}

// ❌ Implicit state
let globalCounter = 0;
function increment() {
  globalCounter++; // Implicit state
}
```

### TypeScript Standards

**Strict mode always:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Explicit types:**
```typescript
// ✅ Explicit return type
function parse(input: string): ParsedResponse {
  // ...
}

// ❌ Implicit
function parse(input: string) {
  // ...
}
```

**No `any`:**
```typescript
// ✅ Use unknown and narrow
function handle(input: unknown): Result {
  if (typeof input !== 'string') {
    throw new Error('Expected string');
  }
  return process(input);
}

// ❌ Never use any
function handle(input: any): any {
  // ...
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Interfaces | PascalCase, I-prefix for abstractions | `ICharacterAgent`, `SceneConfig` |
| Types | PascalCase | `TranscriptEntry`, `ParsedResponse` |
| Functions | camelCase, verb-noun | `parseResponse`, `formatTranscript` |
| Constants | UPPER_SNAKE_CASE | `MAX_BEATS`, `DEFAULT_TONE` |
| Files | kebab-case | `scene-moderator.ts`, `response-parser.ts` |

### File Organization

```typescript
// 1. Imports (grouped)
import { type A, type B } from './types'; // Type imports first
import { utilityFn } from './utils';      // Then value imports

// 2. Type definitions
interface LocalType {
  // ...
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Main functions (exported)
export function mainFunction(/* ... */) {
  // ...
}

// 5. Helper functions (private)
function helperFunction(/* ... */) {
  // ...
}

// 6. No default exports (explicit is better)
```

---

## Error Handling

### Philosophy

**Fail gracefully, log thoroughly, preserve partial results.**

### Patterns

**Return result types:**
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ErrorInfo };

function riskyOperation(): Result<Output> {
  try {
    const result = doThing();
    return { success: true, data: result };
  } catch (e) {
    return {
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: e.message,
        context: { /* relevant data */ }
      }
    };
  }
}
```

**Graceful degradation:**
```typescript
// If parse fails, salvage what's possible
function parseResponse(raw: string): ParsedResponse {
  try {
    return strictParse(raw);
  } catch (e) {
    logger.warn('Strict parse failed, attempting salvage', { raw });
    return salvageParse(raw);
  }
}
```

**Never swallow errors:**
```typescript
// ✅ Log and handle
try {
  doThing();
} catch (e) {
  logger.error('Thing failed', { error: e, context });
  return fallbackBehavior();
}

// ❌ Silent failure
try {
  doThing();
} catch (e) {
  // Nothing - error disappears
}
```

---

## Logging

### Levels

- **error:** Something failed, system impacted
- **warn:** Unexpected but handled (parse salvage, missing optional data)
- **info:** Normal operation milestones (scene started, completed)
- **debug:** Detailed trace (beat-by-beat, responses)

### Structure

```typescript
logger.info('Scene started', {
  sceneName: config.name,
  characterCount: config.characters.length,
  beat: 0
});

logger.error('Character agent failed', {
  character: 'alice',
  beat: 5,
  error: e.message,
  sceneContext: config.prompt
});
```

### What to Log

**Always log:**
- Scene start/end
- Character agent failures
- Parse warnings
- Scene completion decisions
- Errors with full context

**Debug logging:**
- Each beat number
- Response timestamps
- Moderator notes
- Token usage

---

## Implementation Patterns

### Agent Creation

```typescript
class TaskCharacterAgent implements ICharacterAgent {
  constructor(
    public readonly name: string,
    private readonly personality: string,
    private readonly taskFn: TaskFunction // Injected dependency
  ) {}

  async respondTo(update: SceneUpdate): Promise<CharacterResponse> {
    const prompt = this.buildPrompt(update);
    const raw = await this.taskFn({
      description: `${this.name} responds`,
      prompt,
      subagent_type: this.name
    });

    return {
      raw,
      parsed: parseResponse(raw),
      timestamp: Date.now()
    };
  }

  private buildPrompt(update: SceneUpdate): string {
    // ...
  }
}
```

### Scene Loop

```typescript
async runScene(config: SceneConfig): Promise<SceneResult> {
  const agents = await this.loadAgents(config.characters);
  const transcript: TranscriptEntry[] = [];
  let beat = 0;

  while (beat < (config.maxBeats ?? 50)) {
    // Create update
    const update = this.createUpdate(config, transcript, beat);

    // Parallel responses
    const responses = await this.collectResponses(agents, update);

    // Process
    transcript.push(...this.processResponses(responses, beat));

    // Check completion
    if (await this.isComplete(transcript, config)) {
      break;
    }

    beat++;
  }

  return this.generateResult(transcript, config);
}
```

---

## Documentation

### TSDoc for All Public APIs

```typescript
/**
 * Parses a character's natural language response into structured format.
 *
 * Handles variations gracefully, salvaging malformed responses when possible.
 * Never throws - returns response with warning if parsing fails.
 *
 * @param raw - The unparsed LLM output
 * @returns Parsed response with action, tone, content, etc.
 *
 * @example
 * ```typescript
 * const parsed = parseResponse('[TO: Bob, TONE: angry] "Why?"');
 * // { action: 'speak', target: 'Bob', tone: 'angry', content: 'Why?' }
 * ```
 */
export function parseResponse(raw: string): ParsedResponse {
  // ...
}
```

### Inline Comments

Use sparingly, for **why** not **what**:

```typescript
// ✅ Explains reasoning
// Sort by timestamp to preserve interruption order
const sorted = responses.sort((a, b) => a.timestamp - b.timestamp);

// ❌ States the obvious
// Loop through responses
for (const response of responses) {
  // ...
}
```

---

## After Implementation

### Create lessons.md

**Always** create `lessons.md` in the feature directory after implementation (even if incomplete).

Use template from `core/feature-creation.md`.

Include:
- What worked well
- What was harder than expected
- Deviations from spec (with rationale)
- Suggestions for next iteration
- Actual vs. estimated complexity

### Update README

Add feature to status table:
```markdown
| Feature Name | ✅ Complete | [lessons](features/feature-name/lessons.md) |
```

### Capture Metrics

If possible, include in lessons.md:
- Lines of code
- Test coverage percentage
- Implementation time
- Number of tests written

---

## Common Patterns

### Promise.all for Parallel

```typescript
// ✅ Parallel execution
const results = await Promise.all(
  agents.map(agent => agent.respondTo(update))
);

// ❌ Sequential (slower)
const results = [];
for (const agent of agents) {
  results.push(await agent.respondTo(update));
}
```

### Promise.allSettled for Resilience

```typescript
// When some may fail but you want to continue
const results = await Promise.allSettled(
  agents.map(agent => agent.respondTo(update))
);

const successes = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failures = results
  .filter(r => r.status === 'rejected')
  .map(r => r.reason);

// Log failures, continue with successes
```

### Type Guards

```typescript
function isDialogEntry(entry: TranscriptEntry): entry is DialogEntry {
  return entry.type === 'dialog';
}

// Use in filters
const dialogs = transcript.filter(isDialogEntry);
// TypeScript knows dialogs is DialogEntry[]
```

---

## What to Avoid

### Anti-Patterns

❌ **Premature abstraction** - Don't create abstractions until you see repetition

❌ **Clever code** - Straightforward > clever

❌ **Skipping tests** - Never ship without tests

❌ **Console.log for errors** - Use proper logging

❌ **Hardcoded values** - Extract to constants

❌ **Deep nesting** - Extract functions, use early returns

❌ **Large functions** - Keep under 50 lines

---

## Questions to Ask

Before submitting implementation:

- [ ] Did I write tests first?
- [ ] Do all tests pass?
- [ ] Is test coverage > 80%?
- [ ] Are all edge cases handled?
- [ ] Are errors logged with context?
- [ ] Are types explicit (no `any`)?
- [ ] Is it functional (no mutations)?
- [ ] Is it documented with TSDoc?
- [ ] Did I create lessons.md?
- [ ] Did I update README status?

---

*These guidelines evolve based on lessons learned*
*Last update: 2025-10-03*
