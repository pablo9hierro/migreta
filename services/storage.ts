import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, Message, MigrationResponse } from '../types';

// Interface designed to be swappable with Supabase later.
// When switching: replace AsyncStorage calls with supabase.from('sessions')... etc.

const KEY = 'migreta:sessions';

export async function getSessions(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session[]) : [];
}

export async function upsertSession(session: Session): Promise<void> {
  const sessions = await getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
}

export function newSession(sourceLang: string, targetLang: string): Session {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sourceLang,
    targetLang,
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

export function newMessage(userText: string, response: MigrationResponse): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userText,
    response,
    timestamp: new Date().toISOString(),
  };
}
