const pool = require('../db/pool');

const periods = {
  year: { truncate: 'year', format: 'YYYY' },
  quarter: { truncate: 'quarter', format: 'YYYY "Q"Q' },
  month: { truncate: 'month', format: 'YYYY-MM' },
};

async function getHrAnalytics(req, res) {
  const periodKey = req.query.period || 'month';
  const period = periods[periodKey];
  if (!period) {
    return res.status(400).json({ success: false, message: 'Period must be year, quarter, or month.' });
  }

  try {
    const [timelineResult, employeeResult] = await Promise.all([
      pool.query(
        `SELECT to_char(date_trunc($1, created_at), $2) AS period,
                COUNT(*)::int AS booked,
                COUNT(*) FILTER (WHERE status = 'CARPOOLED')::int AS pooled,
                COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
                COUNT(*) FILTER (WHERE status IN ('APPROVED', 'CONFIRMED'))::int AS confirmed
         FROM cab_requests
         GROUP BY date_trunc($1, created_at)
         ORDER BY date_trunc($1, created_at) ASC`,
        [period.truncate, period.format]
      ),
      pool.query(
        `SELECT u.employee_id, u.name, u.department,
                COUNT(r.id)::int AS booked,
                COUNT(r.id) FILTER (WHERE r.status = 'REJECTED')::int AS rejected,
                COUNT(r.id) FILTER (WHERE r.status IN ('APPROVED', 'CONFIRMED'))::int AS confirmed,
                COUNT(r.id) FILTER (WHERE r.status = 'CARPOOLED')::int AS pooled
         FROM users u
         JOIN cab_requests r ON r.user_id = u.id
         GROUP BY u.id
         ORDER BY booked DESC, u.name ASC`
      ),
    ]);

    return res.json({
      success: true,
      period: periodKey,
      timeline: timelineResult.rows,
      employees: employeeResult.rows,
    });
  } catch (error) {
    console.error('HR analytics error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load HR analytics.' });
  }
}

module.exports = { getHrAnalytics };
