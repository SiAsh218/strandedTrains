// =========================
// Stranded Trains - Backend Router
// =========================

const path = require("path");

const socketManager = require("./socketManager");
const usersRepository = require("./database/usersRepository");
const bcrypt = require("bcrypt");

const viewController = require("./controllers/viewController.js");
const dataController = require("./controllers/dataController.js");
const templateEngine = require("./templateEngine.js");
const auth = require("./auth.js");

class Router {
  async handleRequest(req, res) {
    console.log(`${req.method} ${req.url}`);

    try {
      // =========================
      // SINGLE SOURCE OF TRUTH FOR USER
      // =========================
      req.user = auth.getUserFromRequest(req);

      // =========================
      // VIEW ROUTES
      // =========================
      if (req.url === "/" && req.method === "GET") {
        const isLoggedIn = !!req.user;

        const template = await templateEngine.readFileUtf8(
          path.join(viewController.viewsPath, "index.html"),
        );

        const strandedTrains = isLoggedIn
          ? await dataController.getActive()
          : [];

        await viewController.render(template, res, {
          strandedTrains,
          isLoggedIn: isLoggedIn && req.user?.role !== "viewer",
          isAdmin: req.user?.role === "admin",
          showLogin: !isLoggedIn,
        });

        return;
      }

      // =========================
      // AUTH ROUTES
      // =========================
      else if (req.url === "/api/login" && req.method === "POST") {
        const body = await dataController.parseBody(req);

        const sessionId = await auth.authenticate(body.username, body.password);

        if (!sessionId) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              error: "Invalid username or password",
            }),
          );
        }

        res.writeHead(200, {
          "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`,
          "Content-Type": "application/json",
        });

        return res.end(JSON.stringify({ success: true }));
      } else if (req.url === "/api/logout" && req.method === "POST") {
        return auth.logout(req, res);
      }

      // =========================
      // DATA ROUTES
      // =========================

      // GET ACTIVE
      else if (req.url === "/api/stranded-trains" && req.method === "GET") {
        if (!auth.requirePermission("read")(req, res)) return;

        const data = await dataController.getActiveWithoutPhoneNumbers();

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(data));
      }

      // GET ALL
      else if (req.url === "/api/all-stranded-trains" && req.method === "GET") {
        if (!auth.requirePermission("read")(req, res)) return;

        const data = await dataController.getAllWithoutPhoneNumbers();

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(data));
      }

      // GET BY ID
      else if (
        req.url.startsWith("/api/stranded-trains/") &&
        req.method === "GET"
      ) {
        if (!auth.requirePermission("read")(req, res)) return;

        const id = req.url.split("/").pop();
        const data = await dataController.getById(id);

        const canEdit = auth.canEditRecord(req.user, data);

        if (req.user.role === "viewer") {
          data.contactNo = "";
          data.responderNo = "";
          data.championNo = "";
        } else if (
          req.user.role !== "admin" &&
          data.createdByRole !== req.user.role
        ) {
          data.contactNo = "";
          data.responderNo = "";
          data.championNo = "";
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ...data, canEdit }));
      }

      // =========================
      // POWER BI REPORTING ROUTE
      // =========================
      else if (
        req.url.startsWith("/api/reporting/stranded-trains") &&
        req.method === "GET"
      ) {
        if (!auth.requirePermission("read")(req, res)) return;

        const url = new URL(req.url, `http://${req.headers.host}`);

        // Example query string ?from=2026-07-25&to=2026-12-31

        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");

        let data;

        if (from && to) {
          data = await dataController.getByCreatedDateWithoutPhoneNumbers(
            from,
            to,
          );
        } else {
          data = await dataController.getAllWithoutPhoneNumbers();
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(data));
      }

      // CREATE
      else if (req.url === "/api/stranded-trains" && req.method === "POST") {
        if (!auth.requirePermission("write")(req, res)) return;

        const body = await dataController.parseBody(req);

        body.updatedByRole = req.user.role;
        body.createdByRole = req.user.role;

        const result = await dataController.create(body);

        socketManager.getIo().emit("stranded-trains-updated");

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: true,
            id: result.lastInsertRowid,
          }),
        );
      }

      // UPDATE
      else if (
        req.url.startsWith("/api/stranded-trains/") &&
        req.method === "PUT"
      ) {
        if (!auth.requirePermission("write")(req, res)) return;

        const id = req.url.split("/").pop();

        const existing = await dataController.getById(id);

        // ownership check
        if (!auth.canEditRecord(req.user, existing)) {
          res.writeHead(403, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              error: `Entry was created by user with role '${existing.createdByRole}' you don't have permission to edit this entry`,
            }),
          );
        }

        const body = await dataController.parseBody(req);
        body.updatedByRole = req.user.role;

        const result = await dataController.update(id, body);

        socketManager.getIo().emit("stranded-trains-updated");

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: true,
            changes: result.changes,
          }),
        );
      }

      // =========================
      // USER DATA
      // =========================
      else if (req.url === "/api/me" && req.method === "GET") {
        if (!auth.requireAuth(req, res)) return;

        res.writeHead(200, { "Content-Type": "application/json" });

        return res.end(
          JSON.stringify({
            username: req.user.username,
            role: req.user.role,
          }),
        );
      }

      // =========================
      // USER MANAGEMENT
      // =========================

      // GET ALL USERS
      else if (req.url === "/api/users" && req.method === "GET") {
        if (!auth.requirePermission("admin")(req, res)) return;

        const users = usersRepository.getAll();

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        return res.end(JSON.stringify(users));
      }
      // GET USER By ID
      else if (req.url.startsWith("/api/users/") && req.method === "GET") {
        if (!auth.requirePermission("admin")(req, res)) return;

        const id = req.url.split("/").pop();

        const user = usersRepository.getById(id);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        return res.end(JSON.stringify(user));
      }

      // CREATE USER
      else if (req.url === "/api/users" && req.method === "POST") {
        if (!auth.requirePermission("admin")(req, res)) return;

        const body = await dataController.parseBody(req);

        if (!body.username) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "Username is required",
            }),
          );
        }

        if (!body.password) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "Password is required",
            }),
          );
        }

        if (!body.role) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "Role is required",
            }),
          );
        }

        if (usersRepository.usernameExists(body.username)) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "Username already exists",
            }),
          );
        }

        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(body.password)) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error:
                "Password must be at least 8 characters and contain both letters and numbers",
            }),
          );
        }

        const passwordHash = await bcrypt.hash(body.password, 10);

        const result = usersRepository.create({
          username: body.username,
          passwordHash,
          role: body.role,
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify({
            success: true,
            id: result.lastInsertRowid,
          }),
        );
      }

      // Password Reset
      else if (
        /^\/api\/users\/\d+\/password$/.test(req.url) &&
        req.method === "PUT"
      ) {
        if (!auth.requirePermission("admin")(req, res)) return;

        const id = req.url.split("/")[3];

        const body = await dataController.parseBody(req);

        if (!body.password) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "Password is required",
            }),
          );
        }

        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(body.password)) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error:
                "Password must be at least 8 characters and contain both letters and numbers",
            }),
          );
        }

        const passwordHash = await bcrypt.hash(body.password, 10);

        usersRepository.updatePassword(id, passwordHash);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify({
            success: true,
          }),
        );
      }

      // Update User
      else if (req.url.startsWith("/api/users/") && req.method === "PUT") {
        if (!auth.requirePermission("admin")(req, res)) return;

        const id = req.url.split("/").pop();

        const body = await dataController.parseBody(req);

        const existingUser = usersRepository.getById(id);

        const activeAdminCount = usersRepository.getActiveAdminCount();

        const active = Number(body.active);

        const removingLastAdmin =
          existingUser.role === "admin" &&
          existingUser.active === 1 &&
          activeAdminCount === 1 &&
          (body.role !== "admin" || active === 0);

        const disablingSelf =
          existingUser.username === req.user.username && active === 0;

        if (disablingSelf) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "You cannot disable your own account",
            }),
          );
        }

        if (removingLastAdmin) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          return res.end(
            JSON.stringify({
              success: false,
              error: "Cannot remove or disable the last active administrator",
            }),
          );
        }

        usersRepository.updateUser(id, body.role, active);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        return res.end(
          JSON.stringify({
            success: true,
          }),
        );
      }

      // =========================
      // 404
      // =========================
      else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`404 Not Found: ${req.url}`);
      }
    } catch (err) {
      console.error(err);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Internal Server Error",
        }),
      );
    }
  }
}

module.exports = new Router();
