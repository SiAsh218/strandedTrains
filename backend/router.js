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
        let template = await templateEngine.readFileUtf8(
          path.join(viewController.viewsPath, "index.html"),
        );

        const strandedTrains = await dataController.getActive();

        await viewController.render(template, res, strandedTrains);
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
      else if (req.url === "/api/stranded-trains" && req.method === "GET") {
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
        const body = await dataController.parseBody(req);

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
        const id = req.url.split("/").pop();

        const body = await dataController.parseBody(req);

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
