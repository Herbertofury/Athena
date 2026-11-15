"""Isolated R&D local evidence store; no network or model dependencies."""
import hashlib
import json
import sqlite3


def connect(path):
    db = sqlite3.connect(path)
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS generations(id INTEGER PRIMARY KEY, digest TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS documents(generation INTEGER REFERENCES generations(id),
        id TEXT NOT NULL, source TEXT NOT NULL, body TEXT NOT NULL, sha256 TEXT NOT NULL,
        PRIMARY KEY(generation,id));
      CREATE TABLE IF NOT EXISTS state(key TEXT PRIMARY KEY,value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS findings(id INTEGER PRIMARY KEY, generation INTEGER NOT NULL
        REFERENCES generations(id), payload TEXT NOT NULL);
    ''')
    return db


def ingest(db, documents):
    """All-or-nothing new snapshot. Old snapshots and findings are never overwritten."""
    digest = hashlib.sha256(json.dumps(documents, sort_keys=True).encode()).hexdigest()
    with db:
        generation = db.execute('INSERT INTO generations(digest) VALUES (?)', (digest,)).lastrowid
        for doc in documents:
            if set(doc) != {'id', 'source', 'body'} or not all(isinstance(v, str) and v.strip() for v in doc.values()):
                raise ValueError('Each document requires nonempty id, source and body')
            # This experiment only ingests local provenance, never interpreted as instructions.
            if not doc['source'].startswith('fixture://'):
                raise ValueError('Only synthetic fixture provenance is accepted by this experiment')
            sha = hashlib.sha256(doc['body'].encode()).hexdigest()
            db.execute('INSERT INTO documents VALUES (?,?,?,?,?)', (generation, doc['id'], doc['source'], doc['body'], sha))
        db.execute("INSERT OR REPLACE INTO state VALUES ('active',?)", (generation,))
    return generation


def active(db):
    return db.execute("SELECT value FROM state WHERE key='active'").fetchone()[0]


def retrieve(db, query, generation=None):
    generation = active(db) if generation is None else generation
    # Treat the entire input as literal tokens, not arbitrary FTS query syntax.
    tokens = query.split()
    if not tokens:
        return []
    db.execute('DROP TABLE IF EXISTS temp.search')
    db.execute('CREATE VIRTUAL TABLE temp.search USING fts5(id UNINDEXED,body)')
    db.execute('INSERT INTO temp.search SELECT id,body FROM documents WHERE generation=?', (generation,))
    match = ' OR '.join('"' + t.replace('"', '""') + '"' for t in tokens)
    return [dict(zip(('id', 'source', 'sha256', 'body', 'score'), row)) for row in db.execute('''
      SELECT d.id,d.source,d.sha256,d.body,bm25(search)
      FROM temp.search JOIN documents d ON d.id=search.id
      WHERE search MATCH ? AND d.generation=? ORDER BY bm25(search),d.id LIMIT 5
    ''', (match, generation))]


def retain_finding(db, generation, finding):
    with db:
        return db.execute('INSERT INTO findings(generation,payload) VALUES (?,?)',
                          (generation, json.dumps(finding, sort_keys=True))).lastrowid


def rollback(db, generation):
    if not db.execute('SELECT 1 FROM generations WHERE id=?', (generation,)).fetchone():
        raise ValueError('Unknown retained generation')
    with db:
        db.execute("UPDATE state SET value=? WHERE key='active'", (generation,))
