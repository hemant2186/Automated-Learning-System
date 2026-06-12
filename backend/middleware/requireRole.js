/**
 * Role guard middleware. Must run after `auth` so `req.user` is populated.
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'instructor')
 */
function requireRole(...roles) {
  const allowed = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate.' });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return next();
  };
}

module.exports = requireRole;
