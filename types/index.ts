export interface WordMapping {
  original: string;
  target: string;
  wasNative: boolean;
}

export interface LiteralWord {
  nl: string;
  pt: string;
  de: string;
}

export interface MigrationResponse {
  corrected: string;
  wordMap: WordMapping[];
  explanation: string;
  literalExtreme: LiteralWord[] | string; // string = legacy sessions
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
