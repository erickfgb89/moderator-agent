import { describe, it, expect, beforeEach } from 'vitest';
import { SceneModerator } from './scene-moderator';
import { MockCharacterAgent } from '../agents/mock-character-agent';
import type { SceneConfig } from '../types/index.js';

describe('SceneModerator', () => {
  let moderator: SceneModerator;

  beforeEach(() => {
    moderator = new SceneModerator();
  });

  describe('happy path', () => {
    it('should run a simple 2-character scene to completion', async () => {
      const alice = new MockCharacterAgent('alice', [
        '[TO: Bob, TONE: friendly] "Hello Bob!"',
        '[SILENT]',
        '[TO: Bob, TONE: happy] "Great to see you!"'
      ]);

      const bob = new MockCharacterAgent('bob', [
        '[SILENT]',
        '[TO: Alice, TONE: friendly] "Hi Alice!"',
        '[TONE: content] "Likewise!"'
      ]);

      const config: SceneConfig = {
        name: 'test-greeting',
        prompt: 'Alice greets Bob. Goal: Exchange pleasantries.',
        characters: ['alice', 'bob'],
        maxBeats: 10
      };

      const result = await moderator.runSceneWithAgents(config, [alice, bob]);

      expect(result.success).toBe(true);
      expect(result.metadata.totalBeats).toBeGreaterThan(0);
      expect(result.metadata.characterCount).toBe(2);
      expect(result.transcript).toBeTruthy();
    });

    it('should handle parallel responses and sort by timestamp', async () => {
      const alice = new MockCharacterAgent('alice', [
        '[TO: Bob, TONE: angry] "This is wrong!"'
      ]);

      const bob = new MockCharacterAgent('bob', [
        '[TO: Alice, TONE: defensive] "Wait, let me explain!"'
      ]);

      const config: SceneConfig = {
        name: 'test-parallel',
        prompt: 'Alice and Bob respond simultaneously.',
        characters: ['alice', 'bob'],
        maxBeats: 1
      };

      const result = await moderator.runSceneWithAgents(config, [alice, bob]);

      expect(result.success).toBe(true);
      expect(result.transcript).toContain('Alice');
      expect(result.transcript).toContain('Bob');
    });

    it('should filter out SILENT responses', async () => {
      const alice = new MockCharacterAgent('alice', [
        '[TO: Bob, TONE: questioning] "What do you think?"',
        '[SILENT]'
      ]);

      const bob = new MockCharacterAgent('bob', [
        '[SILENT]',
        '[TO: Alice, TONE: thoughtful] "I think we should wait."'
      ]);

      const config: SceneConfig = {
        name: 'test-silent',
        prompt: 'Alice asks Bob a question.',
        characters: ['alice', 'bob'],
        maxBeats: 3
      };

      const result = await moderator.runSceneWithAgents(config, [alice, bob]);

      expect(result.success).toBe(true);
      // Transcript should only have non-silent responses
      const entries = result.transcript.split('\n').filter(l => l.trim());
      // Should have Alice's question and Bob's answer, but not the silent beats
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle all characters responding with SILENT', async () => {
      const alice = new MockCharacterAgent('alice', [
        '[SILENT]',
        '[SILENT]',
        '[SILENT]'
      ]);

      const bob = new MockCharacterAgent('bob', [
        '[SILENT]',
        '[SILENT]',
        '[SILENT]'
      ]);

      const config: SceneConfig = {
        name: 'test-all-silent',
        prompt: 'Both characters are silent.',
        characters: ['alice', 'bob'],
        maxBeats: 3
      };

      const result = await moderator.runSceneWithAgents(config, [alice, bob]);

      expect(result.success).toBe(true);
      expect(result.metadata.completionReason).toBe('max_beats');
    });

    it('should enforce max beats limit', async () => {
      const alice = new MockCharacterAgent('alice', [
        '[TONE: persistent] "Again!"',
        '[TONE: persistent] "Again!"',
        '[TONE: persistent] "Again!"',
        '[TONE: persistent] "Again!"',
        '[TONE: persistent] "Again!"'
      ]);

      const config: SceneConfig = {
        name: 'test-max-beats',
        prompt: 'Alice keeps talking.',
        characters: ['alice'],
        maxBeats: 3
      };

      const result = await moderator.runSceneWithAgents(config, [alice]);

      expect(result.success).toBe(true);
      expect(result.metadata.totalBeats).toBeLessThanOrEqual(3);
      expect(result.metadata.completionReason).toBe('max_beats');
    });
  });

  describe('error handling', () => {
    it('should handle empty character list', async () => {
      const config: SceneConfig = {
        name: 'test-no-chars',
        prompt: 'Nobody here.',
        characters: [],
        maxBeats: 3
      };

      const result = await moderator.runSceneWithAgents(config, []);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });

    it('should handle missing scene prompt', async () => {
      const config: SceneConfig = {
        name: 'test-no-prompt',
        prompt: '',
        characters: ['alice'],
        maxBeats: 3
      };

      const alice = new MockCharacterAgent('alice', []);

      const result = await moderator.runSceneWithAgents(config, [alice]);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });
  });
});
