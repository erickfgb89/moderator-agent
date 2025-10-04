import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeSceneOutputs } from './file-writer';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { SceneResult } from '../types/index.js';

const TEST_DIR = 'data/scenes-test';

describe('writeSceneOutputs', () => {
  beforeEach(async () => {
    // Ensure test directory exists
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should create scene directory with all output files', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Alice: Hello\nBob: Hi',
      metadata: {
        name: 'test-scene',
        duration: 5000,
        totalBeats: 3,
        characterCount: 2,
        goalAchieved: true,
        completionReason: 'goal_achieved',
        characters: ['alice', 'bob'],
        timestamp: '2025-10-03T12:00:00Z'
      },
      outputPath: '/data/scenes/test-scene/'
    };

    const sceneDir = await writeSceneOutputs(result, TEST_DIR);

    expect(sceneDir).toBe(path.join(TEST_DIR, 'test-scene'));

    // Check files exist
    const files = await fs.readdir(sceneDir);
    expect(files).toContain('transcript.txt');
    expect(files).toContain('metadata.json');
  });

  it('should write formatted transcript with header and footer', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Alice [TONE: friendly] "Hello!"',
      metadata: {
        name: 'greeting',
        duration: 2500,
        totalBeats: 1,
        characterCount: 1,
        goalAchieved: true,
        completionReason: 'goal_achieved',
        characters: ['alice'],
        timestamp: '2025-10-03T12:00:00Z'
      },
      outputPath: '/data/scenes/greeting/'
    };

    const sceneDir = await writeSceneOutputs(result, TEST_DIR);
    const transcript = await fs.readFile(
      path.join(sceneDir, 'transcript.txt'),
      'utf-8'
    );

    expect(transcript).toContain('SCENE: greeting');
    expect(transcript).toContain('CHARACTERS: alice');
    expect(transcript).toContain('[SCENE START]');
    expect(transcript).toContain('Alice [TONE: friendly] "Hello!"');
    expect(transcript).toContain('[SCENE END');
    expect(transcript).toContain('STATISTICS:');
    expect(transcript).toContain('Duration: 1 beats, 2.5s');
  });

  it('should write metadata as formatted JSON', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Test',
      metadata: {
        name: 'test',
        duration: 1000,
        totalBeats: 1,
        characterCount: 1,
        goalAchieved: false,
        completionReason: 'max_beats',
        characters: ['alice'],
        timestamp: '2025-10-03T12:00:00Z'
      },
      outputPath: '/data/scenes/test/'
    };

    const sceneDir = await writeSceneOutputs(result, TEST_DIR);
    const metadataContent = await fs.readFile(
      path.join(sceneDir, 'metadata.json'),
      'utf-8'
    );
    const metadata = JSON.parse(metadataContent);

    expect(metadata.name).toBe('test');
    expect(metadata.goalAchieved).toBe(false);
    expect(metadata.completionReason).toBe('max_beats');
  });

  it('should write debug log if provided', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Test',
      metadata: {
        name: 'debug-test',
        duration: 1000,
        totalBeats: 1,
        characterCount: 1,
        goalAchieved: true,
        completionReason: 'goal_achieved',
        characters: ['alice'],
        timestamp: '2025-10-03T12:00:00Z'
      },
      outputPath: '/data/scenes/debug-test/'
    };

    const debugLog = 'Beat 0: Alice responded\nBeat 1: Scene complete';

    const sceneDir = await writeSceneOutputs(result, TEST_DIR, debugLog);
    const logContent = await fs.readFile(
      path.join(sceneDir, 'debug.log'),
      'utf-8'
    );

    expect(logContent).toBe(debugLog);
  });

  it('should not create debug.log if not provided', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Test',
      metadata: {
        name: 'no-debug',
        duration: 1000,
        totalBeats: 1,
        characterCount: 1,
        goalAchieved: true,
        completionReason: 'goal_achieved',
        characters: ['alice'],
        timestamp: '2025-10-03T12:00:00Z'
      },
      outputPath: '/data/scenes/no-debug/'
    };

    const sceneDir = await writeSceneOutputs(result, TEST_DIR);
    const files = await fs.readdir(sceneDir);

    expect(files).not.toContain('debug.log');
  });

  it('should include cost information if available', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Test',
      metadata: {
        name: 'with-costs',
        duration: 1000,
        totalBeats: 1,
        characterCount: 1,
        goalAchieved: true,
        completionReason: 'goal_achieved',
        characters: ['alice'],
        timestamp: '2025-10-03T12:00:00Z',
        costs: {
          totalTokens: 1500,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedUSD: 0.045
        }
      },
      outputPath: '/data/scenes/with-costs/'
    };

    const sceneDir = await writeSceneOutputs(result, TEST_DIR);
    const transcript = await fs.readFile(
      path.join(sceneDir, 'transcript.txt'),
      'utf-8'
    );

    expect(transcript).toContain('Tokens: 1500');
    expect(transcript).toContain('Estimated cost: $0.0450 USD');
  });

  it('should include errors if present', async () => {
    const result: SceneResult = {
      success: true,
      transcript: 'Test',
      metadata: {
        name: 'with-errors',
        duration: 1000,
        totalBeats: 2,
        characterCount: 2,
        goalAchieved: true,
        completionReason: 'goal_achieved',
        characters: ['alice', 'bob'],
        timestamp: '2025-10-03T12:00:00Z',
        errors: [
          {
            beat: 1,
            character: 'bob',
            error: 'Response timeout'
          }
        ]
      },
      outputPath: '/data/scenes/with-errors/'
    };

    const sceneDir = await writeSceneOutputs(result, TEST_DIR);
    const transcript = await fs.readFile(
      path.join(sceneDir, 'transcript.txt'),
      'utf-8'
    );

    expect(transcript).toContain('ERRORS:');
    expect(transcript).toContain('Beat 1 (bob): Response timeout');
  });
});
