-- Intentionally wrong for a ticket-grain work total: detail rows repeat tickets.
SELECT COUNT(*) AS joined_rows, COUNT(DISTINCT t.ticket_id) AS distinct_tickets,
       SUM(t.work_minutes) AS repeated_work_minutes,
       SUM(DISTINCT t.work_minutes) AS distinct_value_work_minutes
FROM tickets AS t
LEFT JOIN touches AS x ON x.ticket_id = t.ticket_id
WHERE t.opened_at >= :start AND t.opened_at < :end;
