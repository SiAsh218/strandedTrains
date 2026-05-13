// =========================
// Stranded Trains - Backend View Controller
// This file contains the logic for rendering HTML views using the Template Engine.
// =========================

// =========================
// Import dependencies
// =========================
const templateEngine = require("../TemplateEngine.js");

class ViewController {
  constructor() {
    this.viewsPath = "./frontend/src/html/";
  }

  /**
   * Method to convert a passed in template using the passed in data and render the resulting HTML
   * @param {String} template HTML string
   * @param {Object} data data
   * @param {Object} res the response object
   */
  async render(template, res, data) {
    try {
      if (template == null) throw new Error("HTML template is blank");

      const html = await templateEngine.getFinalHTML(template, {
        strandedTrains: data,
      });

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  }
}

const viewController = new ViewController();

module.exports = viewController;
