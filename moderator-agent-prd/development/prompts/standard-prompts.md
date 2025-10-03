# Standard Prompts

Reusable prompts for common tasks in this project.

---

## For Claude Code: Implement a Feature

```
I'm implementing the [feature-name] feature for the scene moderator agent.

Context loaded:
- core/design-principles.md
- features/[feature-name]/specification.md
- features/[feature-name]/acceptance.md
- features/[feature-name]/interfaces.md
- development/ai-guidelines.md

Following test-first development:
1. Write failing tests based on acceptance criteria
2. Implement minimum code to pass tests
3. Refactor while keeping tests green
4. Create lessons.md when done

Let's start by writing tests for the happy path cases from the specification.
```

---

## For Claude Code: Review Implementation

```
I've completed the [feature-name] implementation. Please review:

Check:
- [ ] All acceptance criteria met
- [ ] Test coverage > 80%
- [ ] No TypeScript errors
- [ ] Functional style (no mutations)
- [ ] Proper error handling
- [ ] TSDoc on public functions
- [ ] Edge cases handled
- [ ] Logging appropriate

Then help me create lessons.md capturing what we learned.
```

---

## For Claude Code: Debug Issue

```
I'm encountering an issue with [feature-name]:

Issue: [description]

Context:
- Expected behavior: [from spec]
- Actual behavior: [what's happening]
- Relevant code: [file:line]
- Test output: [if applicable]

Please help me:
1. Identify root cause
2. Propose fix aligned with design principles
3. Add test to prevent regression
4. Update lessons.md if this reveals spec issue
```

---

## For Claude Code: Add Test Case

```
I need to add a test for [feature-name] covering [scenario].

From acceptance.md:
- Criterion: [specific acceptance criterion]

Please:
1. Write failing test
2. Run to confirm failure
3. Implement minimum code to pass
4. Verify test passes
```

---

## For Claude Code: Refactor

```
I want to refactor [component] in [feature-name] to [goal].

Current code: [file:lines]

Constraints:
- Must not break existing tests
- Follow design principles (functional, simple)
- Maintain or improve readability

Please:
1. Propose refactoring approach
2. Update code
3. Run tests to confirm green
4. Note improvements in lessons.md
```

---

## For Claude Code: Create New Feature

```
I want to add a new feature: [feature-name]

Purpose: [one sentence]

Following feature creation guide from core/feature-creation.md:

Step 1: Create directory structure
Step 2: Write specification.md (what it does)
Step 3: Write acceptance.md (when it's done)
Step 4: Write interfaces.md (how it connects)
Step 5: Implement with tests first
Step 6: Create lessons.md

Let's start with specification.md. Based on this purpose, what should the feature specification include?
```

---

## For Claude Code: Update PRD

```
Based on implementation of [feature-name], I need to update the PRD.

Changes needed:
- [list changes]

Affected files:
- features/[feature-name]/lessons.md (create/update)
- README.md (update status)
- [others if applicable]

Please:
1. Create lessons.md from our implementation session
2. Update README status table
3. Note any deviations from original spec in lessons
4. Suggest updates to spec if we learned something
```

---

## For Character Agent Prompts

### System Prompt Template

```
You are {CHARACTER_NAME}, a character in a narrative scene.

PERSONALITY:
{personality_from_.claude_agents_file}

COMMUNICATION STYLE:
{communication_style}

CURRENT SCENE CONTEXT:
{scene_context}

RECENT EVENTS:
{transcript_of_recent_exchanges}

LAST EVENT:
{most_recent_dialog_or_world_event}

{moderator_note_if_any}

RESPONSE FORMAT:
You must respond in this format:

- If speaking to someone:
  [TO: {name}, TONE: {emotion}] "your dialog"

- If making an interruption:
  [INTERRUPT after "{phrase to interrupt after}", TONE: {emotion}] "your dialog"

- If staying silent:
  [SILENT] or [SILENT, *non-verbal action*]

- If reacting non-verbally:
  [REACT, TONE: {emotion}, *action description*]

You may include non-verbal actions in [*asterisks*] like: *crosses arms* or *looks away*

IMPORTANT:
- Only respond if your character would naturally speak or react in this moment
- It is perfectly acceptable to stay silent: [SILENT]
- Respond according to your personality and the scene context
- Don't explain your reasoning, just respond in character
```

---

## For Scene Moderator Prompts

### Scene Completion Evaluation

```
Evaluate if this scene has reached its natural conclusion.

SCENE GOAL:
{goal_from_config}

CURRENT TRANSCRIPT:
{formatted_transcript}

ANALYSIS NEEDED:
1. Has the stated goal been achieved?
2. Have all characters expressed their final position?
3. Is there natural closure to the conversation?
4. Or is there more to explore?

Return:
- complete: true/false
- reason: brief explanation
- suggestion: what should happen next (if not complete)
```

### World Event Generation

```
Generate a world event to inject into this scene.

SCENE CONTEXT:
{scene_context}

CURRENT TRANSCRIPT:
{recent_exchanges}

SITUATION:
{why_event_needed}
Examples: "scene is stalled", "need to break tension", "redirect off-topic discussion"

Generate a brief world event description that would:
- Be appropriate to the setting
- Provoke character reactions
- Help scene move toward goal

Format: Single sentence description
Example: "Thunder crashes outside, lights flicker momentarily"
```

---

## For Testing

### Integration Test Prompt

```
Create an integration test for [feature] that:

1. Sets up realistic scene configuration
2. Executes full feature workflow
3. Verifies all outputs
4. Handles async operations properly
5. Cleans up afterwards

Use test data that represents real usage, not trivial examples.
Include at least one edge case variation.
```

### Unit Test Prompt

```
Create comprehensive unit tests for [function] covering:

1. Happy path (typical inputs)
2. Boundary conditions (empty, max, min)
3. Edge cases (unusual but valid inputs)
4. Error conditions (invalid inputs)
5. All branches in the implementation

Aim for 100% code coverage of this function.
```

---

## Template Variables

When using these prompts, replace:

| Variable | Source |
|----------|--------|
| `[feature-name]` | Your feature directory name |
| `{CHARACTER_NAME}` | Character name from config |
| `{personality_from_.claude_agents_file}` | Content of `.claude/agents/{name}.md` |
| `{scene_context}` | `SceneConfig.prompt` |
| `{transcript_of_recent_exchanges}` | Last 10 entries from transcript |
| `{moderator_note_if_any}` | `SceneUpdate.moderatorNote` |
| `{goal_from_config}` | Goal stated in scene prompt |

---

*Add new prompts as patterns emerge*
*Last update: 2025-10-03*
