// Shared memory for every agent, stored in one SQLite file (~/.dc-skills/memory.db).
// WAL mode + busy_timeout let several agents/processes write at the same time.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from './paths.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS memories (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project      TEXT,               -- NULL = global memory (applies to every project)
  project_name TEXT,
  agent        TEXT NOT NULL DEFAULT 'unknown',
  kind         TEXT NOT NULL DEFAULT 'note',  -- note | decision | bug | todo | convention
  content      TEXT NOT NULL,
  tags         TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project, created_at);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  content, tags, content='memories', content_rowid='id'
);
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, tags) VALUES (new.id, new.content, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, tags) VALUES ('delete', old.id, old.content, old.tags);
END;

CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project      TEXT,
  project_name TEXT,
  agent        TEXT NOT NULL DEFAULT 'unknown',
  type         TEXT NOT NULL DEFAULT 'log',
  message      TEXT NOT NULL,
  data         TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project, created_at);

CREATE TABLE IF NOT EXISTS skill_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  reason     TEXT,
  project    TEXT,
  agent      TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | done | rejected
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
`;

let db;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  return db;
}

/** Turns free text into a safe FTS5 query: every word as a prefix match. */
function ftsQuery(text) {
  return String(text)
    .split(/[^\p{L}\p{N}_]+/u)
    .filter(Boolean)
    .map((token) => `"${token}"*`)
    .join(' ');
}

const plain = (rows) => rows.map((row) => ({ ...row }));

export function addMemory({ project = null, projectName = null, agent = 'unknown', kind = 'note', content, tags = '' }) {
  if (!content?.trim()) throw new Error('La memoria no puede estar vacía.');
  const info = getDb()
    .prepare('INSERT INTO memories (project, project_name, agent, kind, content, tags) VALUES (?, ?, ?, ?, ?, ?)')
    .run(project, projectName, agent, kind, content.trim(), tags);
  return Number(info.lastInsertRowid);
}

/** Project memories plus global ones; `project = null` searches everything. */
export function searchMemories({ query, project = null, limit = 20 }) {
  const match = ftsQuery(query);
  if (!match) return [];
  return plain(
    getDb()
      .prepare(
        `SELECT m.* FROM memories_fts f JOIN memories m ON m.id = f.rowid
         WHERE memories_fts MATCH ? AND (? IS NULL OR m.project = ? OR m.project IS NULL)
         ORDER BY f.rank LIMIT ?`,
      )
      .all(match, project, project, limit),
  );
}

export function recentMemories({ project = null, limit = 20 }) {
  return plain(
    getDb()
      .prepare(
        `SELECT * FROM memories WHERE (? IS NULL OR project = ? OR project IS NULL)
         ORDER BY id DESC LIMIT ?`,
      )
      .all(project, project, limit),
  );
}

export function deleteMemory(id) {
  return getDb().prepare('DELETE FROM memories WHERE id = ?').run(id).changes > 0;
}

export function logEvent({ project = null, projectName = null, agent = 'unknown', type = 'log', message, data = null }) {
  getDb()
    .prepare('INSERT INTO events (project, project_name, agent, type, message, data) VALUES (?, ?, ?, ?, ?, ?)')
    .run(project, projectName, agent, type, message, data == null ? null : JSON.stringify(data));
}

export function listEvents({ project = null, limit = 50 }) {
  return plain(
    getDb()
      .prepare('SELECT * FROM events WHERE (? IS NULL OR project = ?) ORDER BY id DESC LIMIT ?')
      .all(project, project, limit),
  );
}

export function addSkillRequest({ name, reason = null, project = null, agent = null }) {
  const existing = getDb()
    .prepare("SELECT id FROM skill_requests WHERE name = ? AND status = 'pending'")
    .get(name);
  if (existing) return Number(existing.id);
  return Number(
    getDb()
      .prepare('INSERT INTO skill_requests (name, reason, project, agent) VALUES (?, ?, ?, ?)')
      .run(name, reason, project, agent).lastInsertRowid,
  );
}

export function listSkillRequests({ status = 'pending' } = {}) {
  return plain(
    getDb()
      .prepare('SELECT * FROM skill_requests WHERE (? IS NULL OR status = ?) ORDER BY id DESC')
      .all(status, status),
  );
}

export function setSkillRequestStatus(name, status) {
  getDb().prepare("UPDATE skill_requests SET status = ? WHERE name = ? AND status = 'pending'").run(status, name);
}

export function listProjects() {
  return plain(
    getDb()
      .prepare(
        `SELECT project, MAX(project_name) AS project_name, SUM(mem) AS memories, SUM(ev) AS events, MAX(last) AS last_activity
         FROM (
           SELECT project, project_name, 1 AS mem, 0 AS ev, created_at AS last FROM memories WHERE project IS NOT NULL
           UNION ALL
           SELECT project, project_name, 0, 1, created_at FROM events WHERE project IS NOT NULL
         ) GROUP BY project ORDER BY last_activity DESC`,
      )
      .all(),
  );
}

export function stats() {
  const one = (sql) => Number(getDb().prepare(sql).get().n);
  return {
    memories: one('SELECT COUNT(*) AS n FROM memories'),
    events: one('SELECT COUNT(*) AS n FROM events'),
    projects: one('SELECT COUNT(DISTINCT project) AS n FROM memories WHERE project IS NOT NULL'),
    pendingRequests: one("SELECT COUNT(*) AS n FROM skill_requests WHERE status = 'pending'"),
    dbPath: DB_PATH,
  };
}
