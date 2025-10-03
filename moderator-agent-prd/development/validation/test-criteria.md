# Test Criteria

How we validate implementations in this project.

---

## Test-First Philosophy

**Every feature starts with failing tests.**

1. Read acceptance criteria
2. Write tests that verify each criterion
3. Run tests (they should fail)
4. Implement minimum code to pass
5. Refactor while keeping tests green
6. Repeat until all criteria met

---

## Test Levels

### Unit Tests

**Scope:** Individual functions in isolation

**Coverage Target:** 100% for critical paths, 80%+ overall

**Examples:**
- `parseResponse()` handles all format variations
- `validateSceneConfig()` rejects invalid inputs
- `formatTranscriptEntry()` produces correct output

**Location:** `tests/unit/`

### Integration Tests

**Scope:** Multiple components working together

**Coverage Target:** All major workflows

**Examples:**
- Full scene execution from config → transcript
- Character agent responds to scene update
- Moderator handles character failure gracefully

**Location:** `tests/integration/`

### End-to-End Tests

**Scope:** Complete system with real agents

**Coverage Target:** Happy path + critical failures

**Examples:**
- 2-character scene reaches goal
- 5-character scene with interruptions
- Scene timeout handled correctly

**Location:** `tests/e2e/`

---

## Acceptance Criteria Testing

Each criterion in `acceptance.md` maps to test case(s).

### Example Mapping

**Acceptance Criterion:**
> Given valid scene config, produces complete transcript

**Test Cases:**
```typescript
describe('SceneModerator', () => {
  it('produces complete transcript for valid config', async () => {
    const config = validSceneConfig();
    const result = await moderator.runScene(config);

    expect(result.success).toBe(true);
    expect(result.transcript).toBeTruthy();
    expect(result.transcript).toContain('[SCENE START]');
    expect(result.transcript).toContain('[SCENE END]');
  });
});
```

**Acceptance Criterion:**
> Handles character agent failure gracefully

**Test Cases:**
```typescript
it('continues scene when one character fails', async () => {
  const agents = [
    mockAgent('alice', alwaysSucceeds),
    mockAgent('bob', alwaysFails),
    mockAgent('charlie', alwaysSucceeds)
  ];

  const result = await moderator.runSceneWithAgents(config, agents);

  expect(result.success).toBe(true);
  expect(result.metadata.errors).toHaveLength(1);
  expect(result.transcript).toContain('alice');
  expect(result.transcript).toContain('charlie');
  expect(result.transcript).toContain('[SYSTEM: bob unable to respond]');
});
```

---

## Test Data

### Use Realistic Data

```typescript
// ✅ Realistic scene config
const config: SceneConfig = {
  name: 'office-confrontation',
  prompt: 'Alice confronts Bob about missing project deadline. Goal: Bob apologizes, Alice accepts.',
  characters: ['alice', 'bob'],
  initialSpeaker: 'alice'
};

// ❌ Trivial test data
const config: SceneConfig = {
  name: 'test',
  prompt: 'test',
  characters: ['a', 'b']
};
```

### Test Data Builders

```typescript
function buildSceneConfig(overrides?: Partial<SceneConfig>): SceneConfig {
  return {
    name: 'test-scene',
    prompt: 'Alice and Bob discuss project.',
    characters: ['alice', 'bob'],
    initialSpeaker: 'alice',
    ...overrides
  };
}

// Usage
const configWithManyCharacters = buildSceneConfig({
  characters: ['alice', 'bob', 'charlie', 'diana']
});
```

---

## Edge Cases to Test

### For Parsers

- Empty string
- Only whitespace
- Missing required fields
- Extra unexpected fields
- Special characters in content
- Very long input (> 10k chars)
- Malformed brackets
- Multiple formats mixed

### For Scene Execution

- Zero characters (invalid)
- One character (edge case)
- Maximum characters (5)
- All characters silent
- All characters respond
- Duplicate character names
- Character file missing
- Scene with no goal
- Immediate goal achievement (1 beat)
- Maximum beats reached

### For Character Agents

- Empty scene update
- Missing transcript
- Invalid moderator note
- Task API timeout
- Task API error
- Malformed LLM response

---

## Error Condition Testing

### Expected Errors

Test that errors are handled gracefully:

```typescript
it('returns error for invalid config', async () => {
  const invalidConfig = { name: '', prompt: '', characters: [] };

  const result = await moderator.runScene(invalidConfig);

  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.error.code).toBe('INVALID_CONFIG');
});
```

### Unexpected Errors

Test resilience to surprises:

```typescript
it('handles character agent throwing exception', async () => {
  const agents = [
    mockAgent('alice', () => { throw new Error('Boom!'); })
  ];

  const result = await moderator.runSceneWithAgents(config, agents);

  // Should not crash entire scene
  expect(result.success).toBe(true);
  expect(result.metadata.errors).toContainEqual(
    expect.objectContaining({ character: 'alice' })
  );
});
```

---

## Async Testing

### Parallel Execution

```typescript
it('sends updates to all agents in parallel', async () => {
  const startTime = Date.now();

  const agents = [
    mockAgent('alice', delayedResponse(1000)),
    mockAgent('bob', delayedResponse(1000)),
    mockAgent('charlie', delayedResponse(1000))
  ];

  await moderator.sendToAll(agents, update);

  const duration = Date.now() - startTime;

  // If parallel: ~1000ms
  // If sequential: ~3000ms
  expect(duration).toBeLessThan(1500);
});
```

### Timeout Handling

```typescript
it('handles character timeout', async () => {
  const agents = [
    mockAgent('alice', delayedResponse(60000)) // 60s timeout
  ];

  const result = await moderator.runSceneWithAgents(config, agents);

  expect(result.metadata.errors).toContainEqual(
    expect.objectContaining({
      character: 'alice',
      error: expect.stringContaining('timeout')
    })
  );
}, 70000); // Test timeout > agent timeout
```

---

## Mocking

### Mock Character Agents

```typescript
function mockAgent(
  name: string,
  responseFn: (update: SceneUpdate) => string
): ICharacterAgent {
  return {
    name,
    async respondTo(update: SceneUpdate): Promise<CharacterResponse> {
      const raw = responseFn(update);
      return {
        raw,
        parsed: parseResponse(raw),
        timestamp: Date.now()
      };
    }
  };
}

// Usage
const alice = mockAgent('alice', () => '[TONE: happy] "Great!"');
const bob = mockAgent('bob', () => '[SILENT]');
```

### Mock File System

```typescript
import { vol } from 'memfs';
import { fs } from 'memfs';

beforeEach(() => {
  vol.reset();
  // Create mock character files
  vol.fromJSON({
    '.claude/agents/alice.md': '# Alice\n\nPersonality: ...',
    '.claude/agents/bob.md': '# Bob\n\nPersonality: ...'
  });
});
```

---

## Snapshot Testing

For formatted output that's complex but stable:

```typescript
it('produces correctly formatted transcript', async () => {
  const result = await moderator.runScene(config);

  expect(result.transcript).toMatchSnapshot();
});
```

**When to use:**
- Transcript formatting
- Metadata JSON structure
- Formatted logs

**When NOT to use:**
- Timestamps (always changing)
- Unique IDs
- Non-deterministic output

---

## Performance Testing

### Token Efficiency

```typescript
it('sends only recent transcript to reduce tokens', async () => {
  const longTranscript = Array(50).fill(mockDialogEntry());

  const update = createSceneUpdate(config, longTranscript, 50);

  // Should truncate to last 10 entries
  const transcriptLines = update.transcript.split('\n');
  expect(transcriptLines.length).toBeLessThanOrEqual(15); // ~10 entries + formatting
});
```

### Processing Time

```typescript
it('completes 15-beat scene in under 60s', async () => {
  const startTime = Date.now();

  const result = await moderator.runScene(config);

  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(60000);
  expect(result.metadata.totalBeats).toBeGreaterThanOrEqual(10);
}, 70000); // Test timeout slightly higher
```

---

## Coverage Requirements

### Minimum Thresholds

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "src/parsers/": {
        "branches": 100,
        "functions": 100,
        "lines": 100,
        "statements": 100
      }
    }
  }
}
```

### What 100% Means

**Critical paths require 100% coverage:**
- Response parsers (brittle, many variations)
- Moderator loop (core logic)
- Validation functions (safety)

**Supporting code can be 80%+:**
- Utility functions
- Formatters
- Logging helpers

---

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── parsers/
│   │   └── response-parser.test.ts
│   ├── moderator/
│   │   └── scene-evaluator.test.ts
│   └── utils/
│       └── transcript-formatter.test.ts
├── integration/
│   ├── character-agent.test.ts
│   └── scene-moderator.test.ts
├── e2e/
│   └── full-scene.test.ts
└── fixtures/
    ├── character-definitions/
    ├── scene-configs.ts
    └── mock-responses.ts
```

### File Naming

- Test file: `{source-file}.test.ts`
- Source: `src/parsers/response-parser.ts`
- Test: `tests/unit/parsers/response-parser.test.ts`

---

## Definition of Done (Testing Perspective)

Feature is done when:

- [ ] All acceptance criteria have corresponding tests
- [ ] All tests pass
- [ ] Coverage meets thresholds (80%+ general, 100% critical)
- [ ] Edge cases covered
- [ ] Error conditions tested
- [ ] No skipped or pending tests
- [ ] Integration test demonstrates feature in context
- [ ] Tests are documented (describe blocks explain purpose)

---

## Continuous Testing

### Pre-commit

Run before every commit:
```bash
npm test
npm run lint
npm run typecheck
```

### CI Pipeline

Run on every push:
- All tests
- Coverage check
- Linting
- Type checking
- Build verification

---

*Test criteria updated as we learn what matters*
*Last update: 2025-10-03*
