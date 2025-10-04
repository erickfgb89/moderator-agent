/**
 * Simple example of running a 2-character scene using filesystem-based agents.
 *
 * Character definitions are loaded from `.claude/agents/alice.md` and
 * `.claude/agents/bob.md` automatically by the SDK.
 */

import { SceneModerator } from '../src/index.js';
import type { SceneConfig } from '../src/index.js';

async function main() {
  // Configure the scene
  // Characters 'alice' and 'bob' are loaded from .claude/agents/*.md
  const config: SceneConfig = {
    name: 'office-discussion',
    prompt: `Alice and Bob are discussing a project deadline that was missed.
Goal: Reach a mutual understanding about what went wrong and agree on next steps.
Setting: Office meeting room, mid-afternoon`,
    characters: ['alice', 'bob'],
    maxBeats: 15
  };

  // Run the scene
  const moderator = new SceneModerator();
  const result = await moderator.runScene(config);

  // Display results
  console.log('\n=== SCENE RESULT ===\n');
  console.log('Success:', result.success);
  console.log('\n=== TRANSCRIPT ===\n');
  console.log(result.transcript);
  console.log('\n=== METADATA ===\n');
  console.log(JSON.stringify(result.metadata, null, 2));
}

main().catch(console.error);
