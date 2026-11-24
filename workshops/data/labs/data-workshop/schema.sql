CREATE TABLE queues (
    queue_id TEXT PRIMARY KEY,
    queue_name TEXT NOT NULL UNIQUE
) STRICT;
CREATE TABLE tickets (
    ticket_id TEXT PRIMARY KEY,
    queue_id TEXT NOT NULL REFERENCES queues(queue_id),
    opened_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('open','closed')),
    work_minutes INTEGER CHECK(work_minutes BETWEEN 0 AND 1440),
    summary TEXT NOT NULL
) STRICT;
CREATE TABLE touches (
    touch_id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(ticket_id),
    minutes INTEGER NOT NULL CHECK(minutes BETWEEN 0 AND 1440)
) STRICT;
CREATE TABLE calendar (day TEXT PRIMARY KEY) STRICT;
