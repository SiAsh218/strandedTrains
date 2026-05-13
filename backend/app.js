// =========================
// Stranded Trains - Backend Application
// This file contains the main application logic for the Stranded Trains backend server.
// It sets up the server, handles static file serving, and sends API requests to the router.
// =========================

const config = require("../config.json");

const http = require("http");
const path = require("path");
const url = require("url");
const fs = require("fs");
const router = require("./router.js");
const db = require("../backend/database/sqlite.js");

class App {
  constructor({ port }) {
    this.port = port;
    this.mode = undefined;
    this.staticFilePath = path.join("..", "./frontend/");

    // Handle uncaught exceptions
    process.on("unhandledRejection", (reason, p) => {
      console.error("Unhandled Rejection at:", p, "reason:", reason);

      process.exit(1);
    });
  }

  /**
   * Method to start the server
   */
  async start() {
    try {
      // Initialise database FIRST
      await db.initialise(config.resetDatabase);

      // Start server
      if (process.env.NODE_ENV === "production") {
        // this.runHTTPS();
        this.runHTTP("production");
      } else {
        this.runHTTP("development");
      }

      this.server.listen(this.port, this.host, () => {
        console.log(
          `server running ${this.mode} on ${this.host} port ${this.port}`,
        );
      });
    } catch (error) {
      console.error("Application startup failed:", error);
      process.exit(1);
    }
  }

  /**
   * Method to run server on HTTP
   */
  runHTTP(mode) {
    this.mode = mode;
    this.host = mode === "production" ? config.prod.ip : config.dev.ip;
    this.server = http.createServer((req, res) => {
      const isStatic = this._serveStaticFiles(req, res);

      if (isStatic) return;

      const fullUrl = new URL(req.url, `http://${req.headers.host}`);

      req.query = Object.fromEntries(fullUrl.searchParams);

      router.handleRequest(req, res);
    });
  }

  /**
   * Method to run server on HTTPS
   */
  runHTTPS() {
    this.mode = "production";
    this.host = config.prod.ip;

    const options = {
      key: fs.readFileSync("SSL/key.txt"),
      cert: fs.readFileSync("SSL/cert.txt"),
    };

    this.server = https.createServer(options, (req, res) => {
      const isStatic = this._serveStaticFiles(req, res);
      if (isStatic) return;

      const parsedUrl = url.parse(req.url, true);
      req.query = parsedUrl.query;

      router.route(req, res);
    });
  }

  /**
   * Method to serve static files
   * @param {Object} req request object
   * @param {Object} res response object
   * @returns {Boolean} true if static file false if not serving static file
   */
  _serveStaticFiles(req, res) {
    // Ignore Chrome DevTools automatic requests
    if (req.url.startsWith("/.well-known")) {
      res.writeHead(410);
      return true;
    }

    const filePath = this._getPath(req.url);

    const contentType = this._getContentType(req);

    if (contentType !== "") {
      if (req.method === "GET") {
        this._serveStatic(res, filePath, contentType);
        return true;
      }
    }
    return false;
  }

  /**
   * Method to get the path being requested
   * @param {String} url the requested URL
   * @returns
   */
  _getPath(url) {
    return path.join(__dirname, this.staticFilePath, url);
  }

  /**
   * Method to get the content type based on the file extention
   * @param {Object} req request object
   * @returns {String} the content type e.g("text/html" || "application/json")
   */
  _getContentType(req) {
    const filePath = path.join(__dirname, this.staticFilePath, req.url);
    const extname = path.extname(filePath);
    let contentType = "";

    switch (extname) {
      case ".html":
        contentType = "text/html";
        break;

      case ".js":
        contentType = "application/javascript";
        break;

      case ".css":
        contentType = "text/css";
        break;

      case ".json":
        contentType = "application/json";
        break;

      case ".png":
        contentType = "image/png";
        break;

      case ".jpg":
        contentType = "image/jpg";
        break;

      case ".svg":
        contentType = "image/svg+xml";
        break;

      case ".xlsx":
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;

      case ".csv":
        contentType = "text/csv";
        break;
    }
    return contentType;
  }

  /**
   * Read a utf8 file (Async)
   * @param {String} filepath path to the file
   * @returns {String} file data
   */
  _readFileUtf8(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, "utf8", (error, data) => {
        if (data) resolve(data);
        else reject({ message: `could not read file at path: ${filepath}` });
      });
    });
  }

  /**
   * Method get serve css files
   * @param {Object} res response object
   * @param {String} filePath path to the css file
   * @param {String} contentType content type of the file
   */
  async _serveStatic(res, filePath, contentType) {
    try {
      const data = await this._readFileUtf8(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    } catch (error) {
      console.error(error);
      res.writeHead(404, {
        "Content-Type": "text/plain",
      });

      res.end("File not found");
    }
  }
}

module.exports = App;
