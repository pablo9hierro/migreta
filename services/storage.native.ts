import * as SQLite from 'expo-sqlite';
import { Session, Message, MigrationResponse } from '../types';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('migreta.db');
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return _db;
}

export async function getSessions(): Promise<Session[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    'SELECT data FROM sessions ORDER BY created_at DESC',
  );
  return rows.map(r => JSON.parse(r.data) as Session);
}

export async function upsertSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO sessions (id, data, created_at) VALUES (?, ?, ?)',
    session.id,
    JSON.stringify(session),
    session.createdAt,
  );
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
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
