export interface TimedTranscriptCue {
  text: string;
  start: number | null;
}

export interface CapturedLesson {
  id?: string;
  title: string;
  url: string;
  text: string;
  cues?: TimedTranscriptCue[];
}

export interface Card {
  id: string;
  target: string;
  sentence: string;
  title: string;
  url: string;
  reading: string;
  translation: string;
  definitions: string[];
}

export interface DictionaryResult {
  reading: string;
  definitions: string[];
}

export type TranslationResult = string;

export type CardMode = 'reading' | 'recall';

export interface PersistedState {
  cards: Card[];
  deck: string;
  mode: CardMode;
}
