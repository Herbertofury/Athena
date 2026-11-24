WITH daily AS (
  SELECT c.day, COUNT(t.ticket_id) AS opened_tickets
  FROM calendar AS c
  LEFT JOIN tickets AS t
    ON substr(t.opened_at, 1, 10) = c.day
   AND t.opened_at >= :start AND t.opened_at < :end
  WHERE c.day >= substr(:start, 1, 10) AND c.day < substr(:end, 1, 10)
  GROUP BY c.day
)
SELECT day, opened_tickets,
       SUM(opened_tickets) OVER (
         ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_opened_tickets
FROM daily
ORDER BY day;
