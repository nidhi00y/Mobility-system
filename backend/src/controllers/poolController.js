const pool = require('../db/pool');
const { sendEmail } = require('../services/emailService');

function validateRequestIds(requestIds, minimum = 2) {
  return Array.isArray(requestIds) &&
    requestIds.length >= minimum &&
    requestIds.every((id) => Number.isInteger(Number(id))) &&
    new Set(requestIds.map(Number)).size === requestIds.length;
}

function dateKey(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

async function getSelectedPendingRequests(client, requestIds) {
  const result = await client.query(
    `SELECT r.*, u.name AS employee_name, u.email AS employee_email
     FROM cab_requests r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = ANY($1::int[]) AND r.status = 'PENDING_HR_APPROVAL'
     ORDER BY r.id
     FOR UPDATE OF r`,
    [requestIds.map(Number)]
  );

  if (result.rows.length !== requestIds.length) {
    const error = new Error('All selected requests must still be pending HR approval.');
    error.statusCode = 400;
    throw error;
  }

  return result.rows;
}

async function approveRequests(client, requests, approverId, status) {
  for (const request of requests) {
    await client.query(
      `INSERT INTO approvals (request_id, approver_id, approval_type, status)
       VALUES ($1, $2, 'HR', 'APPROVED')`,
      [request.id, approverId]
    );
    await client.query(
      `UPDATE cab_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, request.id]
    );
  }
}

async function sendConfirmationEmails(requests, pooled) {
  const results = [];
  for (const request of requests) {
    try {
      const result = await sendEmail({
        to: request.employee_email,
        subject: pooled ? 'Your carpool request is confirmed' : 'Your car request is approved',
        text: pooled
          ? `Hello ${request.employee_name},\n\nYour car request has been approved and confirmed as part of a shared carpool.\n\nDate: ${dateKey(request.travel_date)}\nPickup: ${request.pickup_location}\nPickup Time: ${request.pickup_time}\nDestination: ${request.destination}\n\nRegards,\nMondelez Mobility Services`
          : `Hello ${request.employee_name},\n\nYour car request has been approved for an individual car booking. It has not been pooled with other requests.\n\nDate: ${dateKey(request.travel_date)}\nPickup: ${request.pickup_location}\nPickup Time: ${request.pickup_time}\nDestination: ${request.destination}\n\nRegards,\nMondelez Mobility Services`,
      });
      results.push(result.skipped ? 'skipped' : 'sent');
    } catch (error) {
      console.error('Confirmation email error:', error);
      results.push('failed');
    }
  }

  return {
    total: requests.length,
    sent: results.filter((result) => result === 'sent').length,
    skipped: results.filter((result) => result === 'skipped').length,
    failed: results.filter((result) => result === 'failed').length,
  };
}

async function confirmRequestsSeparately(req, res, minimum = 2) {
  const { requestIds } = req.body;
  if (!validateRequestIds(requestIds, minimum)) {
    return res.status(400).json({
      success: false,
      message: `Select at least ${minimum} different pending request${minimum === 1 ? '' : 's'}.`,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requests = await getSelectedPendingRequests(client, requestIds);
    await approveRequests(client, requests, req.session.user.id, 'CONFIRMED');
    await client.query('COMMIT');
    const emailNotifications = await sendConfirmationEmails(requests, false);
    return res.json({ success: true, confirmed: requests.length, emailNotifications });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm requests separately error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Unable to confirm selected requests.',
    });
  } finally {
    client.release();
  }
}

async function confirmSingleRequest(req, res) {
  req.body = { requestIds: [req.params.id] };
  return confirmRequestsSeparately(req, res, 1);
}

async function confirmRequestsAsPool(req, res) {
  const { requestIds } = req.body;
  if (!validateRequestIds(requestIds)) {
    return res.status(400).json({ success: false, message: 'Select at least two different pending requests.' });
  }
  if (requestIds.length > 4) {
    return res.status(400).json({ success: false, message: 'A shared car pool can contain at most four requests.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const requests = await getSelectedPendingRequests(client, requestIds);
    const first = requests[0];
    const poolResult = await client.query(
      `INSERT INTO car_pools (created_by, travel_date, pickup_time, destination)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.session.user.id, first.travel_date, first.pickup_time, first.destination]
    );
    const createdPool = poolResult.rows[0];
    for (const request of requests) {
      await client.query(
        'INSERT INTO car_pool_members (pool_id, request_id) VALUES ($1, $2)',
        [createdPool.id, request.id]
      );
    }
    await approveRequests(client, requests, req.session.user.id, 'CARPOOLED');
    await client.query('COMMIT');
    const emailNotifications = await sendConfirmationEmails(requests, true);
    return res.status(201).json({ success: true, pool: createdPool, confirmed: requests.length, emailNotifications });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm requests as pool error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Unable to confirm selected requests as a pool.',
    });
  } finally {
    client.release();
  }
}

async function getEligibleRequests(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS employee_name
       FROM cab_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.status = 'APPROVED'
       ORDER BY r.travel_date ASC, r.pickup_time ASC`
    );
    return res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('Eligible requests error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch eligible requests.' });
  }
}

async function createCarPool(req, res) {
  const { requestIds, travel_date, pickup_time, destination } = req.body;

  if (!Array.isArray(requestIds) || requestIds.length < 2) {
    return res.status(400).json({ success: false, message: 'Select at least two approved requests to create a pool.' });
  }

  if (requestIds.length > 4) {
    return res.status(400).json({ success: false, message: 'Maximum 4 people can be selected for a car pool.' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM cab_requests WHERE id = ANY($1) AND status = 'APPROVED'`,
      [requestIds]
    );

    if (result.rows.length !== requestIds.length) {
      return res.status(400).json({ success: false, message: 'Only approved requests can be pooled.' });
    }

    const duplicateCheck = await pool.query(
      `SELECT request_id FROM car_pool_members WHERE request_id = ANY($1)`,
      [requestIds]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'One or more requests are already in a pool.' });
    }

    const poolResult = await pool.query(
      `INSERT INTO car_pools (created_by, travel_date, pickup_time, destination)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.session.user.id, travel_date, pickup_time, destination]
    );

    const createdPool = poolResult.rows[0];

    for (const requestId of requestIds) {
      await pool.query(
        `INSERT INTO car_pool_members (pool_id, request_id) VALUES ($1, $2)`,
        [createdPool.id, requestId]
      );
      await pool.query('UPDATE cab_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['CARPOOLED', requestId]);
    }

    const requestDetails = await pool.query(
            `SELECT r.id, u.email AS employee_email, u.name AS employee_name,
              r.travel_date, r.pickup_location, r.pickup_time, r.destination
       FROM cab_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = ANY($1)`,
      [requestIds]
    );

    const emailNotifications = await sendConfirmationEmails(requestDetails.rows, true);

    return res.status(201).json({ success: true, pool: createdPool, members: requestDetails.rows, emailNotifications });
  } catch (error) {
    console.error('Create pool error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create car pool.' });
  }
}

async function getPools(req, res) {
  try {
    const result = await pool.query(
      `SELECT cp.*, u.name AS created_by_name,
              COUNT(DISTINCT member.request_id)::int AS member_count,
              COALESCE(ARRAY_AGG(DISTINCT employee.name) FILTER (WHERE employee.name IS NOT NULL), ARRAY[]::text[]) AS member_names
       FROM car_pools cp
       JOIN users u ON u.id = cp.created_by
       LEFT JOIN car_pool_members member ON member.pool_id = cp.id
       LEFT JOIN cab_requests request ON request.id = member.request_id
       LEFT JOIN users employee ON employee.id = request.user_id
       GROUP BY cp.id, u.name
       ORDER BY cp.created_at DESC`
    );
    return res.json({ success: true, pools: result.rows });
  } catch (error) {
    console.error('Get pools error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch pools.' });
  }
}

async function getPoolById(req, res) {
  const { id } = req.params;

  try {
    const poolResult = await pool.query('SELECT * FROM car_pools WHERE id = $1', [id]);
    if (!poolResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Pool not found.' });
    }

    const members = await pool.query(
      `SELECT m.*, r.*
       FROM car_pool_members m
       JOIN cab_requests r ON r.id = m.request_id
       WHERE m.pool_id = $1`,
      [id]
    );

    return res.json({ success: true, pool: poolResult.rows[0], members: members.rows });
  } catch (error) {
    console.error('Get pool error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch pool.' });
  }
}

module.exports = {
  getEligibleRequests,
  createCarPool,
  confirmRequestsSeparately,
  confirmSingleRequest,
  confirmRequestsAsPool,
  getPools,
  getPoolById,
};
