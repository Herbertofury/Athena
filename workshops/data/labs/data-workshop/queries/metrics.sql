SELECT COUNT(*) AS tickets,
       COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) AS closed,
       COUNT(work_minutes) AS observed_work_values,
       COALESCE(SUM(CASE WHEN work_minutes IS NULL THEN 1 ELSE 0 END), 0) AS missing_work_values,
       COALESCE(SUM(CASE WHEN work_minutes = 0 THEN 1 ELSE 0 END), 0) AS zero_work_values,
       SUM(work_minutes) AS work_minutes,
       AVG(work_minutes) AS mean_observed_work_minutes,
       1.0 * SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) AS closed_share
FROM tickets
WHERE opened_at >= :start AND opened_at < :end;
