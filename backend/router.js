// =========================
// Stranded Trains - Backend Router
// =========================

const path = require("path");

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

        const data = await dataController.getActive();

        if (req.user.role === "viewer") {
          for (const item of data) {
            item.contactNo = "";
            item.responderNo = "";
            item.championNo = "";
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(data));
      }

      // GET ALL
      else if (req.url === "/api/all-stranded-trains" && req.method === "GET") {
        if (!auth.requirePermission("read")(req, res)) return;

        const data = await dataController.getAll();

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

        if (req.user.role === "viewer") {
          data.contactNo = "";
          data.responderNo = "";
          data.championNo = "";
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
        const body = await dataController.parseBody(req);

        body.updatedByRole = req.user.role;

        const result = await dataController.update(id, body);

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
