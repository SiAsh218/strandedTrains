const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Replace with database users later if required
const USERS = [
  {
    username: "admin",
    // password = railway123
    passwordHash:
      "$2b$10$JQMnKr/OIRiLssu4AeyeyennW4mUuFJ1ruLvqyLAkeKmCFcTNmvGG",
  },
];

const isLoggedIn = (req) => {
  const cookies = parseCookies(req);

  const sessionId = cookies.sessionId;

  if (!sessionId) {
    return false;
  }

  return sessions.has(sessionId);
};

const sessions = new Map();

const parseCookies = (req) => {
  const header = req.headers.cookie;

  if (!header) return {};

  return header.split(";").reduce((acc, cookie) => {
    const parts = cookie.split("=");

    acc[parts[0].trim()] = decodeURIComponent(parts[1]);

    return acc;
  }, {});
};

const authenticate = async (username, password) => {
  const user = USERS.find((u) => u.username === username);

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) return null;

  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, {
    username,
    created: Date.now(),
  });

  return sessionId;
};

const requireAuth = (req, res) => {
  const cookies = parseCookies(req);

  const sessionId = cookies.sessionId;

  if (!sessionId || !sessions.has(sessionId)) {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        error: "Authentication required",
      }),
    );

    return false;
  }

  req.user = sessions.get(sessionId);

  return true;
};

const logout = (req, res) => {
  const cookies = parseCookies(req);

  if (cookies.sessionId) {
    sessions.delete(cookies.sessionId);
  }

  res.writeHead(200, {
    "Set-Cookie": "sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify({ success: true }));
};

module.exports = {
  authenticate,
  requireAuth,
  logout,
  isLoggedIn,
};
