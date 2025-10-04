import { describe, it, expect } from 'vitest';
import { parseResponse } from './response-parser';

describe('parseResponse', () => {
  describe('happy path', () => {
    it('should parse directed dialog', () => {
      const raw = '[TO: Bob, TONE: frustrated] "I can\'t believe this happened!"';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'speak',
        target: 'Bob',
        tone: 'frustrated',
        content: 'I can\'t believe this happened!'
      });
      expect(result.nonverbal).toBeUndefined();
      expect(result.interruptAfter).toBeUndefined();
      expect(result.warning).toBeUndefined();
    });

    it('should parse general dialog without target', () => {
      const raw = '[TONE: nervous] "Maybe we should all calm down."';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'speak',
        tone: 'nervous',
        content: 'Maybe we should all calm down.'
      });
      expect(result.target).toBeUndefined();
    });

    it('should parse dialog with nonverbal action', () => {
      const raw = '[TO: Alice, TONE: apologetic, *looks down*] "I\'m sorry."';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'speak',
        target: 'Alice',
        tone: 'apologetic',
        content: 'I\'m sorry.',
        nonverbal: 'looks down'
      });
    });

    it('should parse interruption', () => {
      const raw = '[INTERRUPT after "I think we should", TONE: angry] "Absolutely not!"';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'interrupt',
        tone: 'angry',
        content: 'Absolutely not!',
        interruptAfter: 'I think we should'
      });
    });

    it('should parse silent response', () => {
      const raw = '[SILENT]';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'silent',
        content: ''
      });
    });

    it('should parse silent with nonverbal', () => {
      const raw = '[SILENT, *turns away and stares out window*]';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'silent',
        content: '',
        nonverbal: 'turns away and stares out window'
      });
    });

    it('should parse react response', () => {
      const raw = '[REACT, TONE: shocked, *drops coffee mug*]';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'react',
        tone: 'shocked',
        nonverbal: 'drops coffee mug',
        content: ''
      });
    });
  });

  describe('salvage parsing', () => {
    it('should salvage response missing tone by using default', () => {
      const raw = '[TO: Bob] "Hello"';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'speak',
        target: 'Bob',
        tone: 'neutral',
        content: 'Hello'
      });
      expect(result.warning).toContain('TONE');
    });

    it('should salvage response with no brackets', () => {
      const raw = 'Just some random text without formatting';
      const result = parseResponse(raw);

      expect(result).toMatchObject({
        action: 'speak',
        tone: 'neutral',
        content: 'Just some random text without formatting'
      });
      expect(result.warning).toBeTruthy();
    });

    it('should detect tone from keywords when missing format', () => {
      const raw = 'I am really angry about this!';
      const result = parseResponse(raw);

      expect(result.tone).toBe('angry');
      expect(result.action).toBe('speak');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const raw = '';
      const result = parseResponse(raw);

      expect(result.action).toBe('silent');
      expect(result.content).toBe('');
    });

    it('should handle multiline content', () => {
      const raw = '[TONE: dramatic] "This is a long speech.\nIt has multiple lines.\nVery important."';
      const result = parseResponse(raw);

      expect(result.content).toContain('multiple lines');
      expect(result.tone).toBe('dramatic');
    });

    it('should handle quotes in nonverbal actions', () => {
      const raw = '[TONE: sarcastic, *makes "air quotes"*] "Sure, whatever you say."';
      const result = parseResponse(raw);

      expect(result.nonverbal).toContain('air quotes');
    });
  });

  describe('error handling', () => {
    it('should never throw on malformed input', () => {
      const badInputs = [
        '[[[BROKEN',
        '}{invalid',
        null as unknown as string,
        undefined as unknown as string
      ];

      badInputs.forEach(input => {
        expect(() => parseResponse(input)).not.toThrow();
      });
    });

    it('should handle missing interrupt phrase gracefully', () => {
      const raw = '[INTERRUPT, TONE: angry] "Stop!"';
      const result = parseResponse(raw);

      expect(result.action).toBe('interrupt');
      expect(result.warning).toBeTruthy();
    });
  });
});
