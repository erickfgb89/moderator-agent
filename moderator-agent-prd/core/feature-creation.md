# Feature Creation Guide

How to add new features to this PRD.

---

## Process

### 1. Create Feature Directory

```bash
mkdir -p moderator-agent-prd/features/[feature-name]
```

**Naming conventions:**
- Lowercase, hyphen-separated
- Verb-noun format (e.g., `parse-response`, `handle-interruptions`)
- Specific, not generic (e.g., `detect-scene-completion`, not `scene-management`)

### 2. Start with Specification

Create `specification.md` first. This defines WHAT the feature does.

**Template:**

```markdown
# [Feature Name]

## Purpose
One-sentence description of what this feature accomplishes.

## User Story
As a [role], I want [capability] so that [benefit].

## Context
Why this feature exists. How it fits into the larger system.

## Behavior

### Happy Path
Step-by-step description of normal operation.

### Edge Cases
- What happens when X?
- What if Y is missing?
- How to handle Z?

### Error Conditions
- Invalid input: [behavior]
- Timeout: [behavior]
- Partial failure: [behavior]

## Examples

### Example 1: [Scenario Name]
Input:
```
[concrete example]
```

Output:
```
[expected result]
```

### Example 2: [Another Scenario]
[repeat]

## Dependencies
- Depends on: [other features]
- Depended on by: [features that need this]

## Non-Goals
What this feature explicitly does NOT do.
```

### 3. Define Acceptance Criteria

Create `acceptance.md`. These are concrete, testable conditions for "done."

**Template:**

```markdown
# Acceptance Criteria: [Feature Name]

## Functional Criteria

- [ ] Given [input], produces [output]
- [ ] Handles [edge case] by [behavior]
- [ ] Fails gracefully when [error condition]
- [ ] Performance: [measurable target]

## Quality Criteria

- [ ] Unit tests cover [X]% of code
- [ ] Integration test demonstrates [scenario]
- [ ] No TypeScript errors
- [ ] Passes linting
- [ ] Documented with TSDoc

## Integration Criteria

- [ ] Integrates with [other feature] via [interface]
- [ ] Produces output consumable by [downstream feature]
- [ ] Logs errors to [location]

## Definition of Done

All criteria above met AND:
- [ ] Code reviewed (or AI-validated)
- [ ] Lessons captured in lessons.md
- [ ] README.md updated with feature status
```

### 4. Document Interfaces (If Applicable)

If feature connects to others, create `interfaces.md`.

**Template:**

```markdown
# Interfaces: [Feature Name]

## Input Contract

### Function Signature
```typescript
function featureName(input: InputType): OutputType
```

### Input Type
```typescript
interface InputType {
  required: string;
  optional?: number;
}
```

### Validation Rules
- `required` must be non-empty
- `optional` must be > 0 if provided

### Examples
```typescript
// Valid
const input = { required: "value", optional: 42 };

// Invalid
const input = { required: "" }; // Fails: required is empty
```

## Output Contract

### Output Type
```typescript
interface OutputType {
  success: boolean;
  data?: ResultData;
  error?: ErrorInfo;
}
```

### Success Response
```typescript
{
  success: true,
  data: { ... }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    context: { ... }
  }
}
```

## Integration Points

### Depends On
- **[Other Feature]**: Uses `OtherFeatureOutput` as input

### Depended On By
- **[Downstream Feature]**: Consumes `OutputType` from this feature

### Side Effects
- Writes to: `/data/scenes/[name]/...`
- Logs to: `debug.log`
- May throw: `FeatureError` (caught by caller)

## Error Handling

| Error Condition | Error Code | Behavior |
|----------------|------------|----------|
| Invalid input | `INVALID_INPUT` | Return error response |
| Timeout | `TIMEOUT` | Partial result + error |
| Dependency failure | `DEPENDENCY_ERROR` | Propagate with context |
```

### 5. Implement (Test-First)

**Write tests BEFORE implementation:**

```typescript
// feature-name.test.ts
import { describe, it, expect } from 'vitest';
import { featureName } from './feature-name';

describe('featureName', () => {
  it('should handle happy path', () => {
    const input = { required: "test" };
    const result = featureName(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle edge case', () => {
    // Test edge case from specification
  });

  it('should fail gracefully on error', () => {
    // Test error condition
  });
});
```

**Then implement to make tests pass.**

### 6. Capture Lessons

After implementation (even if incomplete), create `lessons.md`.

**Template:**

```markdown
# Lessons Learned: [Feature Name]

**Implementation Date:** YYYY-MM-DD
**Status:** [Complete | In Progress | Needs Revision]

## What Worked Well

- [Thing that went smoothly]
- [Technique that helped]
- [Tool that was useful]

## What Was Harder Than Expected

- [Challenge faced]
- [Complexity not anticipated in spec]
- [Dependency issue]

## Deviations from Specification

### [Deviation 1]
**Original spec:** [what we planned]
**Actual implementation:** [what we built]
**Reason:** [why we diverged]
**Impact:** [what this means for other features]

## Suggestions for Next Iteration

- [Improvement idea]
- [Refactoring opportunity]
- [Test we should add]

## Actual vs. Estimated Complexity

**Estimated:** [simple | moderate | complex]
**Actual:** [simple | moderate | complex]
**Reason for difference:** [if they don't match]

## Open Questions

- [Unresolved issue]
- [Decision deferred]
- [Area needing more thought]

## Metrics

- Lines of code: ~[number]
- Test coverage: [percentage]
- Implementation time: [hours/days]
- Bugs found: [count]
```

### 7. Update README

Add feature to implementation status table:

```markdown
| Feature Name | 🔄 In Progress | See [lessons](features/feature-name/lessons.md) |
```

---

## Feature Directory Structure

After following this process, you'll have:

```
features/
└── [feature-name]/
    ├── specification.md      # WHAT it does
    ├── acceptance.md         # WHEN it's done
    ├── interfaces.md         # HOW it connects (if applicable)
    ├── lessons.md            # WHAT we learned (after attempt)
    └── implementation/       # Technical details (optional)
        ├── decisions.md      # Architecture choices
        └── dependencies.md   # External requirements
```

---

## When to Create vs. Extend

### Create New Feature If:
- Distinct functional capability
- Can be tested independently
- Has clear input/output contract
- Different acceptance criteria

### Extend Existing Feature If:
- Variations on same capability
- Shares most acceptance criteria
- Would duplicate interfaces
- Naturally cohesive with existing feature

**Example:**
- `parse-character-response` - one feature
- `parse-dialog-format` + `parse-interrupt-format` - two features (if sufficiently different)

---

## Feature Sizing Guidelines

**Small Feature (1-3 days):**
- Single responsibility
- < 200 lines of code
- 5-10 test cases
- Minimal dependencies

**Medium Feature (1 week):**
- 2-3 related responsibilities
- 200-500 lines of code
- 10-20 test cases
- Some dependencies

**Large Feature (2+ weeks):**
- Consider breaking into smaller features
- Use `implementation/` subdirectory for complexity
- May need multiple lessons.md files

**Too Large:**
- If specification is > 1000 words, break it down
- If acceptance.md has > 20 criteria, split features
- If dependencies form a tree, modularize

---

## Examples from This Project

### Multi-Character Communication
- **Size:** Large (core feature)
- **Has:** specification.md, acceptance.md, interfaces.md
- **Why:** Complex orchestration, many integration points

### Response Format Parsing
- **Size:** Medium
- **Has:** specification.md, acceptance.md, interfaces.md
- **Why:** Clear contract, moderate complexity

### World Event Injection
- **Size:** Small
- **Has:** specification.md, acceptance.md
- **Why:** Simple generation logic, few dependencies

---

## Common Pitfalls

### 1. Skipping Acceptance Criteria
❌ "I'll know it when I see it"
✅ Write concrete, measurable criteria upfront

### 2. Implementation Before Specification
❌ Code first, document later
✅ Spec → Tests → Code → Lessons

### 3. Vague Examples
❌ "Should handle various inputs"
✅ "Given `[TO: Bob, TONE: angry] 'Why?'`, extracts target='Bob', tone='angry', content='Why?'"

### 4. Forgetting Lessons
❌ Move on immediately after implementation
✅ Spend 15 minutes capturing what you learned

### 5. No Error Cases
❌ Only specify happy path
✅ Document every error condition and expected behavior

---

## Templates Location

All templates live in:
```
development/prompts/standard-prompts.md
```

Copy-paste from there when creating new features.

---

## AI Implementation Notes

When using Claude Code to implement a feature:

1. **Load these files first:**
   - `core/design-principles.md`
   - Feature's `specification.md` and `acceptance.md`
   - `development/ai-guidelines.md`

2. **Start conversation with:**
   > "I'm implementing the [feature-name] feature. I've loaded the specification and acceptance criteria. Let's write tests first, then implement to make them pass."

3. **After implementation:**
   > "Implementation complete. Let's create lessons.md based on what we learned."

4. **Update PRD:**
   > "Update README.md to reflect [feature-name] status and link to lessons."

---

*This guide evolves as we learn better practices*
*Last update: 2025-10-03*
