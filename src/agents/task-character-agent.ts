import { query } from '@anthropic-ai/claude-agent-sdk';
import type { ICharacterAgent, SceneUpdate, CharacterResponse } from '../types/index.js';
import { parseResponse } from '../parser/response-parser.js';

/**
 * Character agent implementation using the Claude Agent SDK query() function.
 * Each invocation creates a fresh interaction with no memory of previous beats.
 */
export class TaskCharacterAgent implements ICharacterAgent {
  constructor(
    public readonly name: string,
    private readonly personality: string
  ) {}

  /**
   * Responds to a scene update with the character's action.
   */
  async respondTo(update: SceneUpdate): Promise<CharacterResponse> {
    const prompt = this.buildPrompt(update);
    const raw = await this.callAgent(prompt);
    const timestamp = Date.now();

    return {
      raw,
      parsed: parseResponse(raw),
      timestamp
    };
  }

  /**
   * Builds the prompt for the character agent based on the scene update.
   */
  private buildPrompt(update: SceneUpdate): string {
    return `You are ${this.name}, a character in an ongoing scene. Your personality and behavior:

${this.personality}

## Current Scene Context
${update.sceneContext}

## Recent Transcript
${update.transcript || '[Scene just started]'}

${update.lastEvent ? `## Last Event\n${this.formatEvent(update.lastEvent)}` : ''}

${update.moderatorNote ? `## Moderator Note\n${update.moderatorNote}` : ''}

## Your Response
Beat #${update.beat}

Respond in this format:
- [TO: <character>, TONE: <emotion>] "dialog" for directed speech
- [TONE: <emotion>] "dialog" for general speech
- [INTERRUPT after "<phrase>", TONE: <emotion>] "dialog" to interrupt
- [SILENT] or [SILENT, *nonverbal action*] to stay quiet
- [REACT, TONE: <emotion>, *nonverbal action*] for non-verbal reaction

Examples:
[TO: Alice, TONE: angry] "Why did you do that?"
[TONE: nervous, *fidgets*] "Maybe we should calm down."
[INTERRUPT after "I think we should", TONE: furious] "No!"
[SILENT, *crosses arms*]

You may speak, stay silent, or interrupt based on your personality and the scene context. Choose wisely.`;
  }

  /**
   * Formats a transcript entry for display in the prompt.
   */
  private formatEvent(event: any): string {
    if (event.type === 'dialog') {
      const target = event.target ? ` [TO: ${event.target}]` : '';
      const nonverbal = event.nonverbal ? `, *${event.nonverbal}*` : '';
      return `${event.speaker}${target} [TONE: ${event.tone}${nonverbal}] "${event.content}"`;
    } else if (event.type === 'event') {
      return `[EVENT: ${event.description}]`;
    } else {
      return `[SYSTEM: ${event.message}]`;
    }
  }

  /**
   * Calls the Claude agent and returns the final response text.
   */
  private async callAgent(prompt: string): Promise<string> {
    const messages = query({
      prompt
    });

    let fullResponse = '';

    for await (const message of messages) {
      // Accumulate text from assistant messages
      if (message.type === 'assistant') {
        // Extract text from content blocks
        for (const block of message.message.content) {
          if (block.type === 'text') {
            fullResponse += block.text;
          }
        }
      }
    }

    return fullResponse.trim();
  }
}
