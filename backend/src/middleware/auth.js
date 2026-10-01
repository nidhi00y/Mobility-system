function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    next();
  };
}

module.exports = { requireLogin, requireRole };
