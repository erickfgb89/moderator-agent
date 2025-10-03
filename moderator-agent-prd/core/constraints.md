# Constraints

Technical, business, and resource boundaries that shape our solution.

---

## Technical Constraints

### Claude Code Agent SDK Limitations

**Agent Communication Model**
- Task tool designed for delegation, not peer-to-peer communication
- Subagents return single final result, not ongoing conversation
- No native pub/sub or message broadcast between agents
- Must build orchestration layer on top of SDK

**Single-Mode Operation**
- One request → complete response
- No streaming updates during execution
- Cannot interrupt or redirect mid-scene
- Must plan full scene flow upfront

**Context Windows**
- Each API call consumes tokens
- Full scene context resent to each character each beat
- No shared memory between agents
- Context grows linearly with scene length

**Task Tool Lifecycle (Unknown)**
- Documentation unclear if subagents persist or recreate
- Assume ephemeral (worst case for cost)
- Cannot rely on subagent memory across invocations
- Phase 1 limitation, resolved in Phase 2

### TypeScript & Node.js

**Language Features**
- Must use TypeScript strict mode
- ES2020+ target for modern features
- Async/await for all agent interactions
- No experimental features

**Runtime**
- Node.js 18+ required
- Single-threaded (async concurrency, not parallelism)
- File system access for outputs
- Environment variables for configuration

### File System Structure

**Character Definitions Location**
- MUST be in `.claude/agents/*.md` in user's project
- NOT in this repository
- Read-only access during scene execution
- Markdown format with specific structure

**Output Location**
- `/data/scenes/[scene-name]/` for all outputs
- Must create directories if missing
- Transcript, metadata, and logs separate files
- No database; filesystem is state

---

## Resource Constraints

### Development Resources

**Team Size:** Solo developer + Claude Code
- No code review (rely on tests)
- No dedicated QA
- AI-driven development workflow

**Time Constraints**
- Phase 1 target: Proof of concept, not production
- Focus on core functionality
- Defer optimization to Phase 2

**Expertise**
- Functional programming preferred but not expert
- Multi-agent systems: learning as we go
- Claude API: documented but novel usage pattern

### Computational Resources

**API Costs (Phase 1)**
- Budget: ~$50 for initial development and testing
- Expect $1-2 per scene with Task API
- ~25-50 scenes for validation
- Must track costs to stay within budget

**Processing Time**
- Acceptable: 60s for 15-beat scene
- Too slow: > 2 minutes
- Target user: not latency-sensitive
- Batch processing acceptable

**Token Limits**
- Scene must fit in context window
- Assume ~100k token limit (Claude 3.5 Sonnet)
- Long scenes may need truncation strategy
- Track token usage per beat

---

## Business Constraints

### Scope Limitations

**What We Build**
- Scene execution engine only
- Character agent orchestration
- Transcript generation

**What We Don't Build**
- Character authoring tools
- Story arc management
- UI/visualization
- Real-time editing
- Multi-scene continuity (Phase 1)

**Integration Points**
- Input: Scene config + character references
- Output: Transcript files
- No external APIs beyond Claude
- No databases

### Quality Standards

**Minimum Viable**
- 80% goal achievement rate
- 90% format parsing success
- Readable transcripts
- Graceful error handling

**Not Required (Phase 1)**
- Perfect character consistency
- Production-grade performance
- Enterprise security
- Multi-user support

---

## Design Constraints

### Architecture Decisions

**Interface-First Design**
- `ICharacterAgent` must support both Task and Direct API
- Cannot lock into Task API specifics
- All agent communication through interface
- Swappable implementations required

**No Global State**
- Pure functions where possible
- Explicit state passing
- Immutable data structures preferred
- Scene state in transcript, not memory

**Functional Style**
- Prefer map/reduce over loops
- Avoid mutations
- Compose small functions
- Clear data flow

### Format Constraints

**Character Response Format**
- MUST include: target (if directed), tone
- MUST be parseable with regex
- MUST allow natural language content
- CAN'T be rigid JSON (fights LLM nature)

**Transcript Format**
- Human-readable (not just machine)
- Downstream AI-parseable
- Consistent structure
- No proprietary formats

### Testing Constraints

**Test-First Requirement**
- All features start with failing tests
- Unit tests for parsers and utilities
- Integration tests for full scenes
- Cannot skip tests to ship faster

**Coverage Requirement**
- 80% minimum test coverage
- 100% coverage for critical paths (parsers, moderator loop)
- Tests must run fast (< 10s total)
- Integration tests can be slower (< 60s each)

---

## External Dependencies

### Required Libraries

**Must Use:**
- Claude Code Agent SDK (or Anthropic SDK for Phase 2)
- TypeScript compiler
- Test framework (Jest or Vitest)

**Cannot Use:**
- Other LLM APIs (Claude only)
- External databases (filesystem only)
- Message queues (direct API calls)

### Character Definition Format

**Constraints from Story Projects:**
- Markdown files in `.claude/agents/`
- Filename = character name (lowercase)
- Specific sections expected (Personality, Communication Style, etc.)
- Users control format; we adapt

---

## Platform Constraints

### Claude Code Environment

**Execution Context**
- Runs in user's local environment
- Access to file system
- Environment variables available
- No sandboxing assumptions

**Agent SDK Specifics**
- Task tool for subagents
- Single-mode operation
- Return full result on completion
- No streaming updates

### Output Requirements

**File System Writes**
- Must handle write failures gracefully
- Create directories as needed
- Atomic writes where possible
- No file locking (single process)

---

## Assumptions We're Making

These constraints rely on assumptions. If wrong, design changes:

1. **Task API creates fresh subagents each call**
   - Assumption: No memory between invocations
   - If wrong: Can optimize by reusing agents

2. **Context window sufficient for 30-beat scenes**
   - Assumption: ~3k tokens per beat × 30 = 90k tokens
   - If wrong: Need truncation strategy sooner

3. **Character definitions fit in system prompt**
   - Assumption: Personalities < 2k tokens each
   - If wrong: Need summarization or chunking

4. **Response parsing 90%+ reliable**
   - Assumption: LLMs follow format with examples
   - If wrong: Need stricter enforcement or different format

5. **Parallel agent calls supported**
   - Assumption: SDK allows concurrent Task invocations
   - If wrong: Fall back to sequential (slower but works)

6. **Single-mode adequate for hands-off**
   - Assumption: Don't need real-time updates
   - If wrong: Need streaming mode (different architecture)

---

## Constraint Evolution

### When Constraints Change

If we discover a constraint was wrong:
1. Document in relevant feature's `lessons.md`
2. Assess impact on design
3. Update this document
4. Propose changes to affected features
5. Update tests to reflect new constraints

### Relaxing Constraints

Some constraints may relax in Phase 2:
- ✅ Cost per scene (Direct API + caching)
- ✅ Token efficiency (conversation threads)
- ✅ Context persistence (agent memory)

Some constraints are permanent:
- ❌ Single LLM provider (Claude only)
- ❌ File system outputs (no database)
- ❌ Functional style (design principle)

---

## Trade-offs Forced by Constraints

| Constraint | Trade-off | Mitigation |
|------------|-----------|------------|
| Task API ephemeral | Higher cost | Phase 2: Direct API |
| Single-mode only | No real-time feedback | Rich logging and metadata |
| No shared memory | Resend context each beat | Send only recent history |
| Filesystem only | No query capabilities | Structured JSON metadata |
| Solo developer | Slower iteration | AI pair programming |
| Limited budget | Fewer test scenes | Synthetic variety in tests |

---

*Constraints reviewed and updated as we learn from implementation*
*Last update: 2025-10-03 (initial)*
