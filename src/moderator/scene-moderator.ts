import type {
  ISceneModerator,
  ICharacterAgent,
  SceneConfig,
  SceneResult,
  SceneUpdate,
  TranscriptEntry,
  DialogEntry,
  CharacterResponse,
  SceneMetadata
} from '../types/index.js';

/**
 * Main orchestration class for running multi-character scenes.
 * Manages the scene loop, coordinates character agents, and produces transcripts.
 */
export class SceneModerator implements ISceneModerator {
  /**
   * Runs a complete scene from start to finish.
   * This is the main entry point that will load character definitions.
   */
  async runScene(_config: SceneConfig): Promise<SceneResult> {
    // TODO: Load character definitions from .claude/agents/*.md
    // TODO: Create TaskCharacterAgent instances
    // For now, this method is not implemented
    throw new Error('runScene not yet implemented - use runSceneWithAgents for testing');
  }

  /**
   * Runs a scene with pre-created agent instances.
   * Used for testing and when agents are created externally.
   */
  async runSceneWithAgents(
    config: SceneConfig,
    agents: ICharacterAgent[]
  ): Promise<SceneResult> {
    const startTime = Date.now();

    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      return {
        success: false,
        transcript: '',
        metadata: this.createMetadata(config, 0, startTime, 'error', false),
        outputPath: '',
        error: {
          code: 'INVALID_CONFIG',
          message: validation.error || 'Invalid configuration',
          context: { config }
        }
      };
    }

    const transcript: TranscriptEntry[] = [];
    const maxBeats = config.maxBeats ?? 50;
    let beat = 0;

    // Main scene loop
    while (beat < maxBeats) {
      // Create scene update for this beat
      const update = this.createUpdate(config, transcript, beat);

      // Send to all agents in parallel and collect responses
      const responses = await this.collectResponses(agents, update);

      // Filter out silent responses and add to transcript
      const dialogResponses = responses.filter(r => r.parsed.action !== 'silent');

      for (const response of dialogResponses) {
        const agent = agents.find(a => a.name === response.agentName);
        if (agent) {
          transcript.push(this.responseToEntry(response, agent.name, beat));
        }
      }

      // Check if scene should complete
      if (await this.shouldComplete(transcript, config, beat)) {
        break;
      }

      beat++;
    }

    // Determine completion reason
    const completionReason = beat >= maxBeats ? 'max_beats' : 'goal_achieved';
    const goalAchieved = completionReason === 'goal_achieved';

    // Format final transcript
    const formattedTranscript = this.formatTranscript(transcript, config);

    // Generate metadata
    const metadata = this.createMetadata(
      config,
      beat,
      startTime,
      completionReason,
      goalAchieved
    );

    return {
      success: true,
      transcript: formattedTranscript,
      metadata,
      outputPath: `/data/scenes/${config.name}/`
    };
  }

  /**
   * Validates scene configuration.
   */
  private validateConfig(config: SceneConfig): { valid: boolean; error?: string } {
    if (!config.name || config.name.trim() === '') {
      return { valid: false, error: 'Scene name is required' };
    }

    if (!config.prompt || config.prompt.trim() === '') {
      return { valid: false, error: 'Scene prompt is required' };
    }

    if (!config.characters || config.characters.length === 0) {
      return { valid: false, error: 'At least one character is required' };
    }

    return { valid: true };
  }

  /**
   * Creates a scene update for the current beat.
   */
  private createUpdate(
    config: SceneConfig,
    transcript: TranscriptEntry[],
    beat: number
  ): SceneUpdate {
    // Get last 10 entries for recent context
    const recentTranscript = transcript.slice(-10);
    const lastEvent = transcript[transcript.length - 1] || null;

    return {
      sceneContext: config.prompt,
      transcript: this.formatTranscript(recentTranscript, config),
      lastEvent,
      beat,
      moderatorNote: this.generateModeratorNote(beat, config.maxBeats ?? 50)
    };
  }

  /**
   * Sends updates to all agents in parallel and collects responses.
   */
  private async collectResponses(
    agents: ICharacterAgent[],
    update: SceneUpdate
  ): Promise<Array<CharacterResponse & { agentName: string }>> {
    // Send to all agents in parallel
    const responsePromises = agents.map(async agent => {
      const response = await agent.respondTo(update);
      return { ...response, agentName: agent.name };
    });

    // Collect with error handling
    const results = await Promise.allSettled(responsePromises);

    // Extract successful responses and sort by timestamp
    const responses = results
      .filter((r): r is PromiseFulfilledResult<CharacterResponse & { agentName: string }> =>
        r.status === 'fulfilled'
      )
      .map(r => r.value)
      .sort((a, b) => a.timestamp - b.timestamp);

    return responses;
  }

  /**
   * Converts a character response to a transcript entry.
   */
  private responseToEntry(
    response: CharacterResponse,
    speaker: string,
    beat: number
  ): DialogEntry {
    const parsed = response.parsed;

    return {
      type: 'dialog',
      speaker,
      action: parsed.action === 'interrupt' ? 'interrupt' : parsed.action === 'react' ? 'react' : 'speak',
      target: parsed.target,
      tone: parsed.tone,
      content: parsed.content,
      nonverbal: parsed.nonverbal,
      beat,
      timestamp: response.timestamp
    };
  }

  /**
   * Determines if the scene should complete.
   * TODO: Implement AI-powered completion detection
   */
  private async shouldComplete(
    _transcript: TranscriptEntry[],
    _config: SceneConfig,
    _beat: number
  ): Promise<boolean> {
    // For now, simple heuristic: scene completes on max beats
    // In a full implementation, this would use Claude to evaluate goal achievement
    return false;
  }

  /**
   * Generates a moderator note based on scene progress.
   */
  private generateModeratorNote(currentBeat: number, maxBeats: number): string | undefined {
    const percentComplete = currentBeat / maxBeats;

    if (percentComplete > 0.8) {
      return 'Scene approaching conclusion. Begin wrapping up your character arc.';
    }

    if (percentComplete > 0.6) {
      return 'Scene past midpoint. Consider moving toward resolution.';
    }

    return undefined;
  }

  /**
   * Formats transcript entries into human-readable text.
   */
  private formatTranscript(entries: TranscriptEntry[], _config: SceneConfig): string {
    if (entries.length === 0) {
      return '';
    }

    return entries
      .map(entry => {
        if (entry.type === 'dialog') {
          const target = entry.target ? ` [TO: ${entry.target}]` : '';
          const nonverbal = entry.nonverbal ? `, *${entry.nonverbal}*` : '';
          return `${entry.speaker}${target} [TONE: ${entry.tone}${nonverbal}] "${entry.content}"`;
        } else if (entry.type === 'event') {
          return `[EVENT: ${entry.description}]`;
        } else {
          return `[SYSTEM: ${entry.message}]`;
        }
      })
      .join('\n');
  }

  /**
   * Creates scene metadata.
   */
  private createMetadata(
    config: SceneConfig,
    totalBeats: number,
    startTime: number,
    completionReason: SceneMetadata['completionReason'],
    goalAchieved: boolean
  ): SceneMetadata {
    return {
      name: config.name,
      duration: Date.now() - startTime,
      totalBeats,
      characterCount: config.characters.length,
      goalAchieved,
      completionReason,
      characters: config.characters,
      timestamp: new Date().toISOString()
    };
  }
}
