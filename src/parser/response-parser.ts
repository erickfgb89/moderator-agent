import type { ParsedResponse } from '../types/index.js';

/**
 * Parses a character's natural language response into structured format.
 *
 * Handles variations gracefully, salvaging malformed responses when possible.
 * Never throws - returns response with warning if parsing fails.
 *
 * @param raw - The unparsed LLM output
 * @returns Parsed response with action, tone, content, etc.
 *
 * @example
 * ```typescript
 * const parsed = parseResponse('[TO: Bob, TONE: angry] "Why?"');
 * // { action: 'speak', target: 'Bob', tone: 'angry', content: 'Why?' }
 * ```
 */
export function parseResponse(raw: string): ParsedResponse {
  // Handle null/undefined
  if (!raw) {
    return {
      action: 'silent',
      tone: 'neutral',
      content: '',
      warning: 'Empty or null response'
    };
  }

  // Try strict parse first
  try {
    return strictParse(raw);
  } catch (e) {
    // Salvage what we can
    return salvageParse(raw);
  }
}

/**
 * Attempts strict regex-based parsing of the response format.
 * Throws if format doesn't match expected patterns.
 */
function strictParse(raw: string): ParsedResponse {
  // Extract bracket section and content
  const bracketMatch = raw.match(/^\[(.*?)\]\s*(.*)/s);

  if (!bracketMatch) {
    throw new Error('No bracket section found');
  }

  const [, bracketContent, afterBracket] = bracketMatch;
  const result: ParsedResponse = {
    action: 'speak',
    tone: '',
    content: ''
  };

  // Determine action type
  if (bracketContent.includes('INTERRUPT')) {
    result.action = 'interrupt';

    // Extract interrupt phrase
    const interruptMatch = bracketContent.match(/INTERRUPT after ["']([^"']+)["']/);
    if (interruptMatch) {
      result.interruptAfter = interruptMatch[1];
    } else if (bracketContent.includes('INTERRUPT after')) {
      throw new Error('Interrupt phrase not properly formatted');
    } else {
      // INTERRUPT without "after" phrase
      result.warning = 'INTERRUPT action missing "after" phrase';
    }
  } else if (bracketContent.includes('SILENT')) {
    result.action = 'silent';
  } else if (bracketContent.includes('REACT')) {
    result.action = 'react';
  }

  // Extract target
  const targetMatch = bracketContent.match(/TO:\s*([^,\]]+)/);
  if (targetMatch) {
    result.target = targetMatch[1].trim();
  }

  // Extract tone (required for most actions)
  const toneMatch = bracketContent.match(/TONE:\s*([^,\]*]+)/);
  if (toneMatch) {
    result.tone = toneMatch[1].trim();
  } else if (result.action !== 'silent') {
    // Tone missing but required
    result.tone = 'neutral';
    result.warning = 'Missing required TONE field, defaulted to neutral';
  }

  // Extract nonverbal action
  const nonverbalMatch = bracketContent.match(/\*([^*]+)\*/);
  if (nonverbalMatch) {
    result.nonverbal = nonverbalMatch[1].trim();
  }

  // Extract content (everything after brackets)
  if (afterBracket.trim()) {
    // Remove surrounding quotes if present
    result.content = afterBracket.trim().replace(/^["']|["']$/g, '');
  } else if (result.action === 'speak' || result.action === 'interrupt') {
    // Content expected but missing
    if (!result.warning) {
      result.warning = 'Expected content for speak/interrupt action';
    }
  }

  return result;
}

/**
 * Attempts to salvage a malformed response by looking for recognizable patterns.
 */
function salvageParse(raw: string): ParsedResponse {
  const result: ParsedResponse = {
    action: 'speak',
    tone: 'neutral',
    content: raw,
    warning: 'Failed to parse format, attempting salvage'
  };

  // Try to detect tone from keywords
  const toneKeywords: Record<string, string> = {
    angry: 'angry',
    frustrated: 'frustrated',
    happy: 'happy',
    sad: 'sad',
    nervous: 'nervous',
    excited: 'excited',
    calm: 'calm',
    surprised: 'surprised',
    confused: 'confused',
    worried: 'worried'
  };

  const lowerRaw = raw.toLowerCase();
  for (const [keyword, tone] of Object.entries(toneKeywords)) {
    if (lowerRaw.includes(keyword)) {
      result.tone = tone;
      break;
    }
  }

  // Try to extract quoted content
  const quoteMatch = raw.match(/["']([^"']+)["']/);
  if (quoteMatch) {
    result.content = quoteMatch[1];
  }

  // Check if there's a TO: field we can extract
  const targetMatch = raw.match(/TO:\s*([^,\]]+)/);
  if (targetMatch) {
    result.target = targetMatch[1].trim();
  }

  return result;
}
