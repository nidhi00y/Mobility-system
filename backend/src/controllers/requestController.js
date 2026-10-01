const pool = require('../db/pool');
const { sendEmail } = require('../services/emailService');

async function createRequest(req, res) {
  const { travel_date, pickup_location, destination, pickup_time, passenger_count, purpose } = req.body;
  const userId = req.session.user.id;

  if (!travel_date || !pickup_location || !destination || !pickup_time || !passenger_count || !purpose) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const initialStatus = user.role === 'MANAGER' ? 'PENDING_HR_APPROVAL' : 'PENDING_MANAGER_APPROVAL';

    const requestResult = await pool.query(
      `INSERT INTO cab_requests (user_id, travel_date, pickup_location, destination, pickup_time, passenger_count, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, travel_date, pickup_location, destination, pickup_time, passenger_count, purpose, initialStatus]
    );

    const request = requestResult.rows[0];

    if (user.role === 'MANAGER') {
      await pool.query(
        `INSERT INTO approvals (request_id, approver_id, approval_type, status)
         VALUES ($1, $2, 'HR', 'PENDING')`,
        [request.id, userId]
      );

      const hrUsers = await pool.query('SELECT email, name FROM users WHERE role = $1 AND is_active = true', ['HR']);
      for (const hr of hrUsers.rows) {
        await sendEmail({
          to: hr.email,
          subject: 'Manager request requires HR approval',
          text: `Hello ${hr.name},\n\nA manager request is pending HR approval.\n\nEmployee: ${user.name}\nDate: ${travel_date}\nDestination: ${destination}\nPickup Time: ${pickup_time}\n\nRegards,\nCar Appointment System`,
        });
      }
    } else {
      const managerResult = await pool.query('SELECT * FROM users WHERE id = $1', [user.manager_id]);
      const manager = managerResult.rows[0];
      if (manager) {
        await sendEmail({
          to: manager.email,
          subject: 'Car request requires approval',
          text: `Hello ${manager.name},\n\nA car request requires your approval.\n\nEmployee: ${user.name}\nDate: ${travel_date}\nPickup: ${pickup_location}\nDestination: ${destination}\nPickup Time: ${pickup_time}\nPurpose: ${purpose}\n\nRegards,\nCar Appointment System`,
        });
      }
    }

    return res.status(201).json({ success: true, request });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit request.' });
  }
}

async function getMyRequests(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.*, rejected_approval.rejection_reason
       FROM cab_requests r
       LEFT JOIN LATERAL (
         SELECT a.rejection_reason
         FROM approvals a
         WHERE a.request_id = r.id AND a.status = 'REJECTED'
         ORDER BY a.created_at DESC
         LIMIT 1
       ) rejected_approval ON true
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.session.user.id]
    );
    return res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('My requests error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch requests.' });
  }
}

async function getRequestById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM cab_requests WHERE id = $1', [id]);
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    return res.json({ success: true, request: result.rows[0] });
  } catch (error) {
    console.error('Get request error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch request.' });
  }
}

async function getPendingManagerRequests(req, res) {
  try {
    const result = await pool.query(
            `SELECT r.*, u.name as employee_name, u.email as employee_email,
              u.employee_id, u.department
       FROM cab_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.status = 'PENDING_MANAGER_APPROVAL' AND u.manager_id = $1
       ORDER BY r.created_at DESC`,
      [req.session.user.id]
    );
    return res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('Pending manager requests error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch pending requests.' });
  }
}

async function getHrRequests(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as employee_name, u.email as employee_email
       FROM cab_requests r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    );
    return res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('HR requests error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch requests.' });
  }
}

async function managerApprove(req, res) {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  try {
    const requestResult = await pool.query('SELECT * FROM cab_requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [request.user_id]);
    const user = userResult.rows[0];

    if (request.status !== 'PENDING_MANAGER_APPROVAL') {
      return res.status(400).json({ success: false, message: 'This request is not pending manager approval.' });
    }

    await pool.query(
      `INSERT INTO approvals (request_id, approver_id, approval_type, status, rejection_reason)
       VALUES ($1, $2, 'MANAGER', 'APPROVED', NULL)`,
      [request.id, req.session.user.id]
    );

    const updateStatus = 'PENDING_HR_APPROVAL';
    await pool.query('UPDATE cab_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [updateStatus, id]);

    const hrUsers = await pool.query('SELECT email, name FROM users WHERE role = $1 AND is_active = true', ['HR']);
    for (const hr of hrUsers.rows) {
      await sendEmail({
        to: hr.email,
        subject: 'Employee request is pending HR approval',
        text: `Hello ${hr.name},\n\nAn employee request has been approved by the manager and is now pending HR approval.\n\nEmployee: ${user.name}\nDate: ${request.travel_date}\nPickup: ${request.pickup_location}\nDestination: ${request.destination}\n\nRegards,\nCar Appointment System`,
      });
    }

    return res.json({ success: true, message: 'Request approved by manager.' });
  } catch (error) {
    console.error('Manager approve error:', error);
    return res.status(500).json({ success: false, message: 'Unable to approve request.' });
  }
}

async function managerReject(req, res) {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const reason = typeof rejection_reason === 'string' ? rejection_reason.trim() : '';

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
  }

  try {
    const requestResult = await pool.query('SELECT * FROM cab_requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [request.user_id]);
    const user = userResult.rows[0];

    await pool.query(
      `INSERT INTO approvals (request_id, approver_id, approval_type, status, rejection_reason)
       VALUES ($1, $2, 'MANAGER', 'REJECTED', $3)`,
      [request.id, req.session.user.id, reason]
    );

    await pool.query('UPDATE cab_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['REJECTED', id]);

    let emailSent = false;
    try {
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Your car request was rejected',
        text: `Hello ${user.name},\n\nYour car request was rejected by your manager.\n\nReason: ${reason}\n\nRegards,\nMondelez Mobility Services`,
      });
      emailSent = !emailResult.skipped;
    } catch (error) {
      console.error('Manager rejection email error:', error);
    }

    return res.json({
      success: true,
      emailSent,
      message: emailSent ? 'Request rejected and requester notified.' : 'Request rejected, but the notification email could not be sent.',
    });
  } catch (error) {
    console.error('Manager reject error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reject request.' });
  }
}

async function hrApprove(req, res) {
  const { id } = req.params;

  try {
    const requestResult = await pool.query('SELECT * FROM cab_requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [request.user_id]);
    const user = userResult.rows[0];

    await pool.query(
      `INSERT INTO approvals (request_id, approver_id, approval_type, status)
       VALUES ($1, $2, 'HR', 'APPROVED')`,
      [request.id, req.session.user.id]
    );

    await pool.query('UPDATE cab_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['APPROVED', id]);

    await sendEmail({
      to: user.email,
      subject: 'Your car request is approved',
      text: `Hello ${user.name},\n\nYour car request has been approved by HR for an individual car booking. It has not been pooled with other requests.\n\nDate: ${request.travel_date}\nPickup: ${request.pickup_location}\nDestination: ${request.destination}\n\nRegards,\nMondelez Mobility Services`,
    });

    return res.json({ success: true, message: 'Request approved by HR.' });
  } catch (error) {
    console.error('HR approve error:', error);
    return res.status(500).json({ success: false, message: 'Unable to approve request.' });
  }
}

async function hrReject(req, res) {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const reason = typeof rejection_reason === 'string' ? rejection_reason.trim() : '';

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
  }

  try {
    const requestResult = await pool.query('SELECT * FROM cab_requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [request.user_id]);
    const user = userResult.rows[0];

    await pool.query(
      `INSERT INTO approvals (request_id, approver_id, approval_type, status, rejection_reason)
       VALUES ($1, $2, 'HR', 'REJECTED', $3)`,
      [request.id, req.session.user.id, reason]
    );

    await pool.query('UPDATE cab_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['REJECTED', id]);

    let emailSent = false;
    try {
      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Your car request was rejected',
        text: `Hello ${user.name},\n\nYour car request was rejected by HR.\n\nReason: ${reason}\n\nRegards,\nMondelez Mobility Services`,
      });
      emailSent = !emailResult.skipped;
    } catch (error) {
      console.error('HR rejection email error:', error);
    }

    return res.json({
      success: true,
      emailSent,
      message: emailSent ? 'Request rejected and requester notified.' : 'Request rejected, but the notification email could not be sent.',
    });
  } catch (error) {
    console.error('HR reject error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reject request.' });
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  getPendingManagerRequests,
  getHrRequests,
  managerApprove,
  managerReject,
  hrApprove,
  hrReject,
};
