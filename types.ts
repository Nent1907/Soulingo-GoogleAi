export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface Lesson {
  id: string;
  level: CEFRLevel;
  sentence: string;
  translation: string;
}

export interface AnalysisResult {
  score: number;
  feedback: string;
  highlighted_words: string[]; // Words that need improvement
}

export interface AvatarState {
  id: string;
  name: string;
  originalImage: string | null; // Base64
  generatedImage: string | null; // Base64
  generatedVideo: string | null; // URL
  prompt: string;
  voice: string; // Voice name for TTS
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PRACTICE = 'PRACTICE',
  AVATAR_STUDIO = 'AVATAR_STUDIO',
}