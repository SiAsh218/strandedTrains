// =========================
// Stranded Trains - Backend Entry Point
// =========================

const config = require("./config.json");
const App = require("./backend/app.js");

const port = Number(process.env.PORT || config.port);

if (Number.isNaN(port)) {
  throw new Error("Invalid port configuration");
}

const app = new App({ port });

(async () => {
  try {
    console.log(`Starting server on port ${port}...`);
    await app.start();
    console.log(`Server started on port ${port}`);
  } catch (err) {
    console.error("Application failed to start:", err);
    process.exit(1);
  }
})();
