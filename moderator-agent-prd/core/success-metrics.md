# Success Metrics

How we measure whether this project achieves its goals.

---

## Phase 1: Proof of Concept

### Primary Success Criteria

**1. Autonomous Execution**
- ✅ Scene completes without human intervention
- ✅ Moderator handles errors gracefully
- ✅ Returns complete transcript on success
- **Target:** 95% of scenes complete successfully

**2. Character Independence**
- ✅ Each character is separate agent instance
- ✅ No character has access to others' reasoning
- ✅ Responses vary across multiple runs of same scene
- **Validation:** Run identical scene 3x, verify different dialog

**3. Dialog Quality**
- ✅ Characters stay in personality throughout scene
- ✅ Emotional responses feel appropriate
- ✅ Natural pacing (not all rapid-fire responses)
- **Validation:** Human evaluation on 1-5 scale, avg > 3.5

**4. Format Compliance**
- ✅ 90%+ responses parse correctly on first attempt
- ✅ Salvage logic handles remaining 10%
- ✅ Transcript is readable and well-formatted
- **Target:** < 5% scenes with parsing errors

**5. Goal Achievement**
- ✅ Moderator detects scene completion accurately
- ✅ Scene goals stated in prompt are achieved
- ✅ Natural ending, not just timeout
- **Target:** 80%+ scenes achieve stated goals

---

## Functional Metrics

### Response Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| Character consistency | 90%+ responses in-character | Human evaluation + personality drift detection |
| Format compliance | 90%+ parse on first try | Automated: `parseCharacterResponse()` success rate |
| Silence appropriateness | Characters silent when fitting | Check SILENT responses correlate with personality |
| Interruption naturalness | Interruptions feel organic | Human evaluation: "Did this interrupt make sense?" |

### Scene Execution

| Metric | Target | Measurement |
|--------|--------|-------------|
| Completion rate | 95%+ | `sceneResult.success === true` |
| Goal achievement | 80%+ | `sceneResult.metadata.goalAchieved === true` |
| Average scene length | 10-30 beats | `sceneResult.metadata.totalBeats` |
| Timeout rate | < 5% | Scenes hitting `maxBeats` limit |

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Processing time | < 60s for 15-beat scene | `sceneResult.metadata.duration` |
| Cost per scene (Phase 1) | < $2.00 USD | `sceneResult.metadata.costs.estimatedUSD` |
| Token efficiency | Decreasing over time | Track tokens per beat |
| Error recovery | 100% handled gracefully | No unhandled exceptions |

---

## Quality Metrics

### Transcript Readability

**Human Evaluation (1-5 scale):**
- Clarity: Can you follow who's speaking?
- Naturalness: Does dialog sound human?
- Formatting: Is it easy to read?
- Completeness: Are events and actions clear?

**Target:** Average > 4.0 across all dimensions

### Character Authenticity

**Consistency Check:**
For each character, evaluate 10 random responses:
- Does this match personality description?
- Is emotional tone appropriate?
- Would this character say this?

**Target:** 90%+ responses rated "yes"

### Emergence Quality

**Unexpected Moments:**
- Count interruptions per scene
- Count silent responses per scene
- Count overlapping dialog instances
- Measure variation across identical scene runs

**Target:** Sufficient variation to feel "alive" (subjective but observable)

---

## Technical Metrics

### Code Quality

| Metric | Target | Tool |
|--------|--------|------|
| Test coverage | > 80% | Jest/Vitest |
| TypeScript strict mode | 100% compliance | tsc --strict |
| Linting | Zero errors | ESLint |
| Build success | 100% | CI/CD pipeline |

### Documentation

| Metric | Target | Validation |
|--------|--------|------------|
| All interfaces documented | 100% | TSDoc coverage |
| All public functions documented | 100% | TSDoc coverage |
| PRD completeness | All sections filled | Manual review |
| Lessons captured | After each feature | lessons.md exists |

---

## Phase 2: Optimization (Future)

### Cost Reduction

| Metric | Phase 1 Baseline | Phase 2 Target |
|--------|------------------|----------------|
| Cost per scene | ~$1.50 | < $0.50 |
| Token usage | ~15k per scene | < 5k per scene |
| Cache hit rate | 0% | > 70% |

### Performance Improvement

| Metric | Phase 1 Baseline | Phase 2 Target |
|--------|------------------|----------------|
| Scene processing time | ~45s | < 20s |
| Response latency | Variable | Consistent |

---

## Anti-Metrics

Things we explicitly DON'T optimize for in Phase 1:

❌ **Minimum scene length** - Short scenes are fine if goal achieved
❌ **Maximum expressiveness** - Don't encourage verbosity
❌ **Perfect format compliance** - 90% is sufficient
❌ **Sub-second response times** - Quality > speed
❌ **Zero cost** - Willing to pay for quality

---

## Measurement Protocol

### Automated Collection

```typescript
interface SceneMetrics {
  sceneId: string;
  timestamp: number;
  success: boolean;
  goalAchieved: boolean;
  totalBeats: number;
  duration: number;
  costs: {
    totalTokens: number;
    estimatedUSD: number;
  };
  characterCount: number;
  responses: {
    total: number;
    parsed: number;
    salvaged: number;
    failed: number;
  };
  interruptions: number;
  silences: number;
}
```

Save to: `/data/scenes/[scene-name]/metrics.json`

### Human Evaluation

**Frequency:** Every 10 scenes or weekly, whichever comes first

**Process:**
1. Randomly select 3 completed scenes
2. Read transcripts blind (no metadata)
3. Score on quality dimensions (1-5)
4. Note specific issues or highlights
5. Log in `/data/evaluations/YYYY-MM-DD.md`

**Dimensions:**
- Dialog quality
- Character consistency
- Naturalness of flow
- Formatting clarity
- Goal achievement

### Weekly Review

**Every Sunday:**
- Aggregate automated metrics
- Review human evaluations
- Identify trends (improving/degrading)
- Prioritize issues for next week
- Update PRD if patterns emerge

---

## Success Gates

Before moving to Phase 2, must achieve:

- [x] 95% completion rate across 20+ test scenes
- [x] 80% goal achievement rate
- [x] Average human evaluation > 3.5/5
- [x] < 5% parsing error rate
- [x] Full test coverage for core features
- [x] Complete lessons.md for all features

If we hit these gates: **Phase 1 is validated**, move to optimization.

If we don't: **Iterate on Phase 1** until we do.

---

## Dashboard View

**Ideal Quick-Glance Metrics:**

```
=== Scene Moderator Agent - Health Dashboard ===

Completion Rate:    ████████████████░░ 87% (target: 95%)
Goal Achievement:   ██████████████████ 92% (target: 80%)
Dialog Quality:     ███████████████░░░ 3.8/5 (target: 3.5)
Parse Success:      ████████████████░░ 88% (target: 90%)
Avg Cost/Scene:     $1.23 (target: < $2.00)
Avg Duration:       42s (target: < 60s)

Recent Issues:
- Character "Bob" drifting from personality in long scenes
- Interruptions sometimes parsed as regular dialog
- Scene completion occasionally premature

Trending: ↗ Quality improving, ↘ costs decreasing
```

---

*Metrics reviewed and updated after each phase completion*
*Last update: 2025-10-03 (initial baseline)*
