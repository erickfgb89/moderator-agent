/**
 * Simple example of running a 2-character scene
 */

import { SceneModerator, TaskCharacterAgent } from '../src/index.js';
import type { SceneConfig } from '../src/index.js';

async function main() {
  // Create character agents
  const alice = new TaskCharacterAgent(
    'alice',
    `You are Alice, a direct and honest person who values truth and clarity.
You speak your mind but try to be respectful.
You tend to be assertive and don't shy away from confrontation when needed.`
  );

  const bob = new TaskCharacterAgent(
    'bob',
    `You are Bob, a thoughtful and diplomatic person who seeks harmony.
You prefer to find common ground and avoid conflict when possible.
You listen carefully before responding and consider others' feelings.`
  );

  // Configure the scene
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
  const result = await moderator.runSceneWithAgents(config, [alice, bob]);

  // Display results
  console.log('\n=== SCENE RESULT ===\n');
  console.log('Success:', result.success);
  console.log('\n=== TRANSCRIPT ===\n');
  console.log(result.transcript);
  console.log('\n=== METADATA ===\n');
  console.log(JSON.stringify(result.metadata, null, 2));
}

main().catch(console.error);
