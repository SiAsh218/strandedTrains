const crypto = require("crypto");
const bcrypt = require("bcrypt");

// =========================
// USERS (replace with DB later)
// =========================
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
  {
    username: "vieweruser",
    role: "viewer",
    passwordHash:
      "$2b$10$yg9e.j81UA07myHOCjjb6eJ8PN6P1HxKsarE4rYeH4fhIdo3ZZtc2",
  },
];

// =========================
// ROLE PERMISSIONS
// =========================
const PERMISSIONS = {
  read: ["admin", "gwr", "xc", "gts", "viewer"],
  write: ["admin", "gwr", "xc", "gts"],
  admin: ["admin"],
};

// =========================
// SESSION STORE
// =========================
const sessions = new Map();

// =========================
// COOKIE PARSER
// =========================
const parseCookies = (req) => {
  const header = req.headers.cookie;
  if (!header) return {};

  return header.split(";").reduce((acc, cookie) => {
    const [key, ...v] = cookie.split("=");
    acc[key.trim()] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
};

// =========================
// GET USER FROM REQUEST
// =========================
const getUserFromRequest = (req) => {
  const cookies = parseCookies(req);
  const sessionId = cookies.sessionId;

  if (!sessionId) return null;
  if (!sessions.has(sessionId)) return null;

  return sessions.get(sessionId);
};

// =========================
// AUTH: LOGIN
// =========================
const authenticate = async (username, password) => {
  const user = USERS.find((u) => u.username === username);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, {
    username: user.username,
    role: user.role,
    created: Date.now(),
  });

  return sessionId;
};

// =========================
// AUTH: LOGOUT
// =========================
const logout = (req, res) => {
  const cookies = parseCookies(req);
  const sessionId = cookies.sessionId;

  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.writeHead(200, {
    "Set-Cookie": "sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax",
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify({ success: true }));
};

// =========================
// CHECK LOGIN
// =========================
const isLoggedIn = (req) => {
  return !!getUserFromRequest(req);
};

// =========================
// REQUIRE AUTH
// =========================
const requireAuth = (req, res) => {
  if (!req.user) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Authentication required",
      }),
    );
    return false;
  }

  return true;
};

// =========================
// REQUIRE PERMISSION (RBAC)
// =========================
const requirePermission = (permissionKey) => {
  return (req, res) => {
    if (!req.user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
      );
      return false;
    }

    const allowedRoles = PERMISSIONS[permissionKey];

    if (!allowedRoles) {
      throw new Error(`Unknown permission: ${permissionKey}`);
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Forbidden",
        }),
      );
      return false;
    }

    return true;
  };
};

// =========================
// OPTIONAL ROLE CHECK
// =========================
const hasRole = (req, roles = []) => {
  const user = getUserFromRequest(req);
  if (!user) return false;
  return roles.includes(user.role);
};

const canEditRecord = (user, record) => {
  if (!user || !record) return false;

  // admin can edit everything
  if (user.role === "admin") return true;

  // must match creator role
  return user.role === record.createdByRole;
};

// =========================
// EXPORTS
// =========================
module.exports = {
  authenticate,
  logout,
  isLoggedIn,
  requireAuth,
  requirePermission,
  hasRole,
  getUserFromRequest,
  canEditRecord,
};
