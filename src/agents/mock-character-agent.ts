import type { ICharacterAgent, SceneUpdate, CharacterResponse } from '../types/index.js';
import { parseResponse } from '../parser/response-parser.js';

/**
 * Mock character agent for testing.
 * Returns predefined responses instead of calling the actual API.
 */
export class MockCharacterAgent implements ICharacterAgent {
  private responseQueue: string[] = [];
  private callCount = 0;

  constructor(
    public readonly name: string,
    responses: string[] = []
  ) {
    this.responseQueue = [...responses];
  }

  /**
   * Returns the next queued response.
   */
  async respondTo(_update: SceneUpdate): Promise<CharacterResponse> {
    const raw = this.responseQueue[this.callCount] || '[SILENT]';
    this.callCount++;

    return {
      raw,
      parsed: parseResponse(raw),
      timestamp: Date.now()
    };
  }

  /**
   * Adds a response to the queue.
   */
  queueResponse(response: string): void {
    this.responseQueue.push(response);
  }

  /**
   * Gets the number of times respondTo was called.
   */
  getCallCount(): number {
    return this.callCount;
  }
}
