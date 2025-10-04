import { query } from '@anthropic-ai/claude-agent-sdk';
import type { ICharacterAgent, SceneUpdate, CharacterResponse } from '../types/index.js';
import { parseResponse } from '../parser/response-parser.js';

/**
 * Character agent implementation using the Claude Agent SDK with filesystem-based agents.
 *
 * Characters are defined in `.claude/agents/{name}.md` files and automatically loaded
 * by the SDK. This agent class coordinates scene updates and parses responses.
 */
export class TaskCharacterAgent implements ICharacterAgent {
  constructor(public readonly name: string) {}

  /**
   * Responds to a scene update with the character's action.
   *
   * Uses the SDK's agents parameter to invoke the filesystem-based character agent.
   */
  async respondTo(update: SceneUpdate): Promise<CharacterResponse> {
    const prompt = this.buildScenePrompt(update);
    const raw = await this.callCharacterAgent(prompt);
    const timestamp = Date.now();

    return {
      raw,
      parsed: parseResponse(raw),
      timestamp
    };
  }

  /**
   * Builds the scene-specific prompt for the character agent.
   * The character's personality is already in their .md file.
   */
  private buildScenePrompt(update: SceneUpdate): string {
    return `## Current Scene Context
${update.sceneContext}

## Recent Transcript
${update.transcript || '[Scene just started]'}

${update.lastEvent ? `## Last Event\n${this.formatEvent(update.lastEvent)}` : ''}

${update.moderatorNote ? `## Moderator Note\n${update.moderatorNote}` : ''}

## Your Response
Beat #${update.beat}

Respond as your character to this scene update using the format specified in your character definition.`;
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
   * Calls the character agent by explicitly requesting it in the prompt.
   * The SDK auto-loads the agent from `.claude/agents/{name}.md` and routes to it.
   */
  private async callCharacterAgent(prompt: string): Promise<string> {
    // Request the character agent explicitly by name
    const agentPrompt = `Use the ${this.name} agent to respond to this scene update:\n\n${prompt}`;

    const messages = query({
      prompt: agentPrompt
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
