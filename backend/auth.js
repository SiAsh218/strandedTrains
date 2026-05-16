const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Replace with database
const USERS = [
  {
    username: "admin",
    role: "admin",
    passwordHash:
      "$2b$10$JQMnKr/OIRiLssu4AeyeyennW4mUuFJ1ruLvqyLAkeKmCFcTNmvGG",
  },
  {
    username: "gwruser1",
    role: "gwr",
    passwordHash:
      "$2b$10$HCtcw4c9Vkbrry7KJC56MO4fwTAjFIlg2kfscyCRMq/ke6O.fvwUG",
  },
  {
    username: "xcuser2",
    role: "xc",
    passwordHash:
      "$2b$10$siVE54NarC2ChTFDs9hOXu1tCtb6.W.0kvMPv.BcrXYoBgovfi/du",
  },
  {
    username: "gtsuser3",
    role: "gts",
    passwordHash:
      "$2b$10$..yFPKcTfJdAvSx6MOkK0OH3e3nMzhjWRPDh8EvJJFUqJSpRfEImO",
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
    role: user.role,
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

const canEdit = (user, targetRole) => {
  console.log(
    "Checking permissions for user:",
    user,
    "targetRole:",
    targetRole,
  );

  if (!user || !user.role) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  return user.role === targetRole;
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
  canEdit,
};
