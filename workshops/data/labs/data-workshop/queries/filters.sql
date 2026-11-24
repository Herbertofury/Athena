SELECT ticket_id, queue_id, opened_at, status, work_minutes
FROM tickets
WHERE opened_at >= :start AND opened_at < :end
ORDER BY opened_at, ticket_id;
