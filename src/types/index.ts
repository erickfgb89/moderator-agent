/**
 * Core type definitions for the Scene Moderator Agent.
 * Based on architecture/data-model.md
 */

// ============================================================================
// Scene Configuration
// ============================================================================

export interface SceneConfig {
  name: string;
  prompt: string;
  characters: string[];
  initialSpeaker?: string;
  maxBeats?: number;
}

// ============================================================================
// Scene Updates
// ============================================================================

export interface SceneUpdate {
  sceneContext: string;
  transcript: string;
  lastEvent: TranscriptEntry | null;
  moderatorNote?: string;
  beat: number;
}

// ============================================================================
// Character Responses
// ============================================================================

export interface CharacterResponse {
  raw: string;
  parsed: ParsedResponse;
  timestamp: number;
}

export interface ParsedResponse {
  action: 'speak' | 'interrupt' | 'silent' | 'react';
  target?: string;
  tone: string;
  content: string;
  nonverbal?: string;
  interruptAfter?: string;
  warning?: string;
}

// ============================================================================
// Transcript Entries
// ============================================================================

export type TranscriptEntry = DialogEntry | WorldEventEntry | SystemEntry;

export interface DialogEntry {
  type: 'dialog';
  speaker: string;
  action: 'speak' | 'interrupt' | 'react';
  target?: string;
  tone: string;
  content: string;
  nonverbal?: string;
  beat: number;
  timestamp: number;
}

export interface WorldEventEntry {
  type: 'event';
  description: string;
  beat: number;
  timestamp: number;
}

export interface SystemEntry {
  type: 'system';
  message: string;
  beat: number;
  timestamp: number;
}

// ============================================================================
// Scene Results
// ============================================================================

export interface SceneResult {
  success: boolean;
  transcript: string;
  metadata: SceneMetadata;
  outputPath: string;
  error?: ErrorInfo;
}

export interface SceneMetadata {
  name: string;
  duration: number;
  totalBeats: number;
  characterCount: number;
  goalAchieved: boolean;
  completionReason: 'goal_achieved' | 'natural_end' | 'max_beats' | 'error';
  costs?: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    estimatedUSD: number;
  };
  errors?: ErrorLog[];
  characters: string[];
  timestamp: string;
}

export interface ErrorLog {
  beat: number;
  character?: string;
  error: string;
  context?: Record<string, unknown>;
}

export interface ErrorInfo {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

// ============================================================================
// Agent Interfaces
// ============================================================================

export interface ICharacterAgent {
  name: string;
  respondTo(update: SceneUpdate): Promise<CharacterResponse>;
}

export interface ISceneModerator {
  runScene(config: SceneConfig): Promise<SceneResult>;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDialogEntry(entry: TranscriptEntry): entry is DialogEntry {
  return entry.type === 'dialog';
}

export function isWorldEventEntry(entry: TranscriptEntry): entry is WorldEventEntry {
  return entry.type === 'event';
}

export function isSystemEntry(entry: TranscriptEntry): entry is SystemEntry {
  return entry.type === 'system';
}
