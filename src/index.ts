/**
 * Scene Moderator Agent - Main entry point
 *
 * A Claude-powered scene moderator that orchestrates multi-character narrative scenes
 * with autonomous character agents.
 */

// Core types
export type {
  SceneConfig,
  SceneUpdate,
  SceneResult,
  SceneMetadata,
  CharacterResponse,
  ParsedResponse,
  TranscriptEntry,
  DialogEntry,
  WorldEventEntry,
  SystemEntry,
  ICharacterAgent,
  ISceneModerator,
  ErrorInfo,
  ErrorLog
} from './types/index.js';

// Type guards
export {
  isDialogEntry,
  isWorldEventEntry,
  isSystemEntry
} from './types/index.js';

// Parser
export { parseResponse } from './parser/response-parser.js';

// Agents
export { TaskCharacterAgent } from './agents/task-character-agent.js';
export { MockCharacterAgent } from './agents/mock-character-agent.js';

// Moderator
export { SceneModerator } from './moderator/scene-moderator.js';
