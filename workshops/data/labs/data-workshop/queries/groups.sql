SELECT q.queue_id, q.queue_name, COUNT(t.ticket_id) AS tickets,
       SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) AS closed,
       COUNT(t.work_minutes) AS observed_work_values,
       SUM(t.work_minutes) AS work_minutes,
       AVG(t.work_minutes) AS mean_observed_work_minutes,
       1.0 * SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.ticket_id), 0) AS closed_share
FROM queues AS q
LEFT JOIN tickets AS t
  ON t.queue_id = q.queue_id
 AND t.opened_at >= :start AND t.opened_at < :end
GROUP BY q.queue_id, q.queue_name
ORDER BY q.queue_name, q.queue_id;
