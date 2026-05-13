// =========================
// Stranded Trains - Backend Entry Point
// =========================

const config = require("./config.json");
const App = require("./backend/app.js");

const app = new App({ port: config.port });

app.start();
