const usersRepository = require("./database/usersRepository.js");

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const SERVICE_USERS = {
  powerbi: {
    username: "powerbi",
    role: "viewer",
  },
};

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
  const apiUser = getApiUser(req);

  if (apiUser) {
    return apiUser;
  }

  // Existing session cookie logic
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
  const user = usersRepository.getByUsername(username);

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return null;
  }

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

const getApiUser = (req) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) return null;

  if (apiKey === process.env.POWERBI_API_KEY) {
    return {
      username: "powerbi",
      role: "viewer",
    };
  }

  return null;
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
