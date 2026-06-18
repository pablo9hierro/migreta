export interface WordMapping {
  original: string;
  target: string;    // Dutch
  de: string;        // German
  wasNative: boolean;
}

export interface LiteralWord {
  pt: string;
  nl: string;
  de: string;
}

export interface GrammarExample {
  nl: string;
  pt: string;
  de: string;
  note: string;
}

export interface MigrationResponse {
  corrected: string;
  wordMap: WordMapping[];
  explanation: GrammarExample[] | string;  // string = legacy sessions
  literalExtreme: LiteralWord[] | string;  // string = legacy sessions
  literalExamples: string[];
}

export interface Message {
  id: string;
  userText: string;
  response: MigrationResponse;
  timestamp: string;
}

export interface Session {
  id: string;
  sourceLang: string;
  targetLang: string;
  messages: Message[];
  createdAt: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}
