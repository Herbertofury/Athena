WITH per_ticket AS (
  SELECT ticket_id, COUNT(*) AS touches, SUM(minutes) AS touch_minutes
  FROM touches
  GROUP BY ticket_id
)
SELECT COUNT(*) AS ticket_rows, SUM(t.work_minutes) AS work_minutes,
       SUM(COALESCE(p.touches, 0)) AS touch_rows,
       SUM(COALESCE(p.touch_minutes, 0)) AS touch_minutes
FROM tickets AS t
LEFT JOIN per_ticket AS p ON p.ticket_id = t.ticket_id
WHERE t.opened_at >= :start AND t.opened_at < :end;
