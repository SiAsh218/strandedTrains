// =========================
// Stranded Trains - Backend Router
// This file contains the routing logic for the Stranded Trains backend server.
// It defines how different API endpoints and view routes are handled.
// =========================

// =========================
// Import dependencies
// =========================
const path = require("path");

const viewController = require("./controllers/viewController.js");
const dataController = require("./controllers/dataController.js");
const templateEngine = require("./templateEngine.js");
const auth = require("./auth.js");

class Router {
  constructor() {}

  /**
   * Method to handle incoming requests and route them to the appropriate controller
   * @param {object} req request object
   * @param {object} res response object
   */
  async handleRequest(req, res) {
    console.log(`${req.method} ${req.url}`);

    try {
      // =========================
      // VIEW ROUTES
      // =========================

      if (req.url === "/" && req.method === "GET") {
        const isLoggedIn = await auth.isLoggedIn(req);

        let template = await templateEngine.readFileUtf8(
          path.join(viewController.viewsPath, "index.html"),
        );

        const strandedTrains = await dataController.getActive();

        await viewController.render(template, res, {
          strandedTrains,
          isLoggedIn,
        });
      }

      // =========================
      // AUTH ROUTES
      // =========================
      // Login route
      else if (req.url === "/api/login" && req.method === "POST") {
        const body = await dataController.parseBody(req);

        const sessionId = await auth.authenticate(body.username, body.password);

        if (!sessionId) {
          res.writeHead(401, {
            "Content-Type": "application/json",
          });

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

        res.end(JSON.stringify({ success: true }));
      }

      // Log out route
      else if (req.url === "/api/logout" && req.method === "POST") {
        auth.logout(req, res);
      }

      // =========================
      // DATA ROUTES
      // =========================

      // GET ALL Active
      else if (req.url === "/api/stranded-trains" && req.method === "GET") {
        const data = await dataController.getActive();
        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify(data));
      }

      // GET ALL
      else if (req.url === "/api/all-stranded-trains" && req.method === "GET") {
        const data = await dataController.getAll();
        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify(data));
      }

      // GET BY ID
      else if (
        req.url.startsWith("/api/stranded-trains/") &&
        req.method === "GET"
      ) {
        const id = req.url.split("/").pop();

        const data = await dataController.getById(id);
        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify(data));
      }

      // CREATE
      else if (req.url === "/api/stranded-trains" && req.method === "POST") {
        if (!auth.requireAuth(req, res)) return;

        const body = await dataController.parseBody(req);
        body.updatedByRole = req.user.role;
        body.createdByRole = req.user.role;

        const result = await dataController.create(body);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
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
        console.log("Cookie header:", req.headers.cookie);
        if (!auth.requireAuth(req, res)) return;

        const id = req.url.split("/").pop();

        const existing = await dataController.getById(id);

        console.log("Existing record:", existing);

        if (!auth.canEdit(req.user, existing.createdByRole)) {
          res.writeHead(403, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              error: "You don't have permission to edit this operators records",
            }),
          );
        }

        const body = await dataController.parseBody(req);
        body.updatedByRole = req.user.role;

        const result = await dataController.update(id, body);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: true,
            changes: result.changes,
          }),
        );
      }

      // DELETE
      // else if (
      //   req.url.startsWith("/api/stranded-trains/") &&
      //   req.method === "DELETE"
      // ) {
      //   if (!auth.requireAuth(req, res)) return;
      //   const id = req.url.split("/").pop();

      //   const result = await dataController.delete(id);

      //   res.writeHead(200, {
      //     "Content-Type": "application/json",
      //   });

      //   res.end(
      //     JSON.stringify({
      //       success: true,
      //       changes: result.changes,
      //     }),
      //   );
      // }

      // =========================
      // 404
      // =========================
      else {
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        res.end(`404 Not Found: ${req.url}`);
      }
    } catch (err) {
      console.error(err);

      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: false,
          error: err.message,
        }),
      );
    }
  }
}

module.exports = new Router();
