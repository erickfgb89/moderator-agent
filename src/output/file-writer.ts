import * as fs from 'fs/promises';
import * as path from 'path';
import type { SceneResult, SceneMetadata } from '../types/index.js';

/**
 * Writes scene outputs to the filesystem.
 *
 * Creates the directory structure:
 * /data/scenes/{scene-name}/
 *   ├── transcript.txt
 *   ├── metadata.json
 *   └── debug.log
 */

/**
 * Writes all scene outputs to disk.
 *
 * @param result - Complete scene result
 * @param baseDir - Base directory for scene outputs (default: data/scenes)
 * @param debugLog - Optional debug log content
 * @returns Path to the created scene directory
 */
export async function writeSceneOutputs(
  result: SceneResult,
  baseDir: string = 'data/scenes',
  debugLog?: string
): Promise<string> {
  const sceneDir = path.join(baseDir, result.metadata.name);

  // Create scene directory
  await fs.mkdir(sceneDir, { recursive: true });

  // Write transcript
  const transcriptPath = path.join(sceneDir, 'transcript.txt');
  const formattedTranscript = formatTranscriptFile(result);
  await fs.writeFile(transcriptPath, formattedTranscript, 'utf-8');

  // Write metadata
  const metadataPath = path.join(sceneDir, 'metadata.json');
  await fs.writeFile(
    metadataPath,
    JSON.stringify(result.metadata, null, 2),
    'utf-8'
  );

  // Write debug log if provided
  if (debugLog) {
    const debugPath = path.join(sceneDir, 'debug.log');
    await fs.writeFile(debugPath, debugLog, 'utf-8');
  }

  return sceneDir;
}

/**
 * Formats the complete transcript file with header and footer.
 */
function formatTranscriptFile(result: SceneResult): string {
  const meta = result.metadata;

  const header = `SCENE: ${meta.name}
CHARACTERS: ${meta.characters.join(', ')}
GENERATED: ${meta.timestamp}
DURATION: ${(meta.duration / 1000).toFixed(1)}s
BEATS: ${meta.totalBeats}
GOAL ACHIEVED: ${meta.goalAchieved ? 'Yes' : 'No'}
COMPLETION: ${formatCompletionReason(meta.completionReason)}

---

[SCENE START]

`;

  const footer = `
[SCENE END - ${meta.goalAchieved ? 'Goal Achieved' : formatCompletionReason(meta.completionReason)}]

---

STATISTICS:
- Duration: ${meta.totalBeats} beats, ${(meta.duration / 1000).toFixed(1)}s
- Characters: ${meta.characterCount}
${meta.costs ? `- Tokens: ${meta.costs.totalTokens} (${meta.costs.inputTokens} in, ${meta.costs.outputTokens} out)
- Estimated cost: $${meta.costs.estimatedUSD.toFixed(4)} USD` : ''}
${meta.errors && meta.errors.length > 0 ? `\nERRORS:\n${formatErrors(meta.errors)}` : ''}
`;

  return header + result.transcript + footer;
}

/**
 * Formats completion reason for display.
 */
function formatCompletionReason(reason: SceneMetadata['completionReason']): string {
  switch (reason) {
    case 'goal_achieved':
      return 'Goal Achieved';
    case 'natural_end':
      return 'Natural Ending';
    case 'max_beats':
      return 'Max Beats Reached';
    case 'error':
      return 'Error';
    default:
      return reason;
  }
}

/**
 * Formats error log for display.
 */
function formatErrors(errors: SceneMetadata['errors']): string {
  if (!errors || errors.length === 0) {
    return '';
  }

  return errors
    .map(err => {
      const char = err.character ? ` (${err.character})` : '';
      return `- Beat ${err.beat}${char}: ${err.error}`;
    })
    .join('\n');
}
