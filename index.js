// =========================
// Stranded Trains - Backend Entry Point
// =========================

const config = require("./config.json");
const App = require("./backend/app.js");

const port = process.env.PORT || config.port;

const app = new App({ port: port });

app.start();
