import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'interview.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      job_title TEXT NOT NULL,
      job_requirements TEXT NOT NULL,
      candidate_name TEXT NOT NULL,
      resume_content TEXT NOT NULL,
      resume_summary_formatted TEXT NOT NULL,
      interviewer_style TEXT DEFAULT 'professional',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      interview_id TEXT UNIQUE NOT NULL,
      overall_score INTEGER NOT NULL,
      technical_score INTEGER NOT NULL,
      communication_score INTEGER NOT NULL,
      experience_score INTEGER NOT NULL,
      potential_score INTEGER NOT NULL,
      strengths TEXT NOT NULL,
      risks TEXT NOT NULL,
      suggestions TEXT NOT NULL,
      question_review TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}