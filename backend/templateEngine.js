// =========================
// Stranded Trains - Backend Template Engine
// This file contains the logic for converting HTML templates and data into final HTML to be rendered,
// including handling of partials, conditionals, and loops.
// =========================

// =========================
// Import dependencies
// =========================
const fs = require("fs");

class TemplateEngine {
  constructor() {
    this.viewPath = "";
    this.partialsPath = "";
  }

  /**
   * Method to covert passed in HTML template string and data into the final HTML to be rendered
   * @param {String} template The passed in HTML template string
   * @param {Object} data The passed in data object
   * @returns {String} The final HTML to be rendered
   *
   * @example
   *  const data = {
        name: "John Doe",
        age: 30,
        isMarried: true,
        hobbies: [
          { name: "Reading", frequency: "daily" },
          { name: "Swimming", frequency: "weekly" }
        ],
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY"
        }
      };

      @example
      const template = `
      <div>
        <h1>{{name}}</h1>
        <p>Age: {{age}}</p>
        {{if_isMarried}}
          <p>Married</p>
          {{else}}
          <p>Not Married</p>
        {{/if_isMarried}}
        <h2>Hobbies:</h2>
        <ul>
          {{hobbies_template}}
            <li>{{name}} ({{frequency}})</li>
          {{/hobbies_template}}
        </ul>
        <h2>Address:</h2>
        <p>{{address.street}}, {{address.city}}, {{address.state}}</p>
      </div>
    `;
   */
  async getFinalHTML(template, data) {
    try {
      const partials = await templateEngine._getPartials(template);
      template = templateEngine._replaceIncludes(template, partials);
      return templateEngine._convertTemplate(template, data);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Method to convert passed in html template into the final html and includes need processing before the template is passed into this function
   * @param {String} template passed in html template
   * @param {Object} data passed in data object
   * @returns {String} the final html to be rendered
   */
  _convertTemplate(template, data) {
    for (const key in data) {
      if (Array.isArray(data[key])) {
        template = this._handleArray(template, data, key);
      } else if (typeof data[key] === "boolean") {
        template = this._handleBoolean(template, data, key);
      } else {
        if (!Array.isArray(data[key])) {
          template = this._replaceObjectPlaceholders(template, data);
        }

        template = this._replacePlaceholders(template, key);
      }
    }

    // template = this._replaceIncludes(template, data);

    return template;
  }

  /**
   * Method to handle arrays passed in the data object
   * @param {String} template
   * @param {Object} data
   * @param {*} key the key of the current data object being looped through
   * @returns {String} updated template string
   */
  _handleArray(template, data, key) {
    // check that key exists in the HTML
    const itemTemplateMatch = template.match(
      new RegExp(`{{${key}_template}}(.*?){{/${key}_template}}`, "s"),
    );

    // get template string
    const itemTemplate = itemTemplateMatch ? itemTemplateMatch[1] : "";

    // loop through array and create HTML string
    const itemHTML = data[key].reduce((acc, item) => {
      return acc + this._convertTemplate(itemTemplate, item);
    }, "");

    // console.log(template);

    // replace placeholder with HTML
    template = template.replace(
      new RegExp(`{{${key}_template}}.*?{{/${key}_template}}`, "s"),
      itemHTML,
    );

    return template;
  }

  /**
   * Method to handle boolean values passed in the data object
   * @param {String} template
   * @param {Object} data
   * @param {*} key the key of the current data object being looped through
   * @returns {String} updated template string
   */
  _handleBoolean(template, data, key) {
    // get the boolean value
    const value = data[key];

    // get start index of the if matching the key
    const startExp = new RegExp(`{{if_${key}}}`, "s");
    let startIndex = template.search(startExp);

    // get end index of the if matching the key
    const endExp = new RegExp(`{{/if_${key}}}`, "s");
    let endIndex = template.search(endExp);

    if (startIndex !== -1 && endIndex !== -1) {
      // set content variable to html between the {{if_key}}{{/if_key}} tags
      let content = template.substring(
        startIndex + `{{if_${key}}}`.length,
        endIndex,
      );

      // if value is true and contains else statement
      if (value && content.includes("{{else}}")) {
        content = content.split("{{else}}")[0].trim();
      }

      // if value is false and there is no else statement return empty string
      if (!value && !content.includes("{{else}}")) {
        content = "";
      }

      // if value is false and there is an else statement
      else if (!value && content.includes("{{else}}")) {
        content = content.split("{{else}}")[1].trim();
      }

      // replace the matched string with the HTML stored in content variable
      template = template.replace(
        template.substring(startIndex, endIndex + `{{/if_${key}}}`.length),
        content,
      );
    }
    return template;
  }

  /**
   * Metod to replace variables with the data passed in
   * @param {String} template the html string passed in
   * @param {Object} data the data passed in
   * @param {String} key the key of the data (used to manage objects)
   * @returns {String} the template with placeholders replaced with their values
   */
  _replacePlaceholders(template, key) {
    return template.replace(new RegExp(`{{${key}}}`, "sg"), key || "");
  }

  /**
   *Method to replace variables with data passed in if placeholder is an object
   * @param {*} template the html string passed in
   * @param {*} data the data passed in
   * @returns {String} the template with placeholders replaced with their values
   */
  _replaceObjectPlaceholders(template, data) {
    return (template = template.replace(
      /{{(\w+(?:\.\w+)*)}}/g,
      (match, key) => {
        let value = data;
        const keys = key.split(".");
        for (let i = 0; i < keys.length; i++) {
          value = value[keys[i]];
          if (value === undefined) break;
        }

        return value !== undefined ? value : match;
      },
    ));
  }

  /**
   * Async method to get partial data
   * @param {String} template the HTML template string
   * @returns {Array} array of objects containing partial information
   * * example return [ {name: "header", content: [some html code] }, {name: "footer", content: [some html code] } ]
   * * templateEngine.partialsPath must be set to the folder where the partial files are located
   */
  async _getPartials(template) {
    const partialNames = this._getPartialNames(template);

    let partials = [];
    if (partialNames.length > 0) {
      try {
        for (const name of partialNames) {
          const content = await templateEngine._getIncludeInfo(name);
          partials.push({ name, content });
        }
      } catch (err) {
        console.error(err);
        return err;
      }
    }
    return partials;
  }

  /**
   * Async method to get the content each partial in the passed in Array
   * @param {String} partialName partial name (not including the .html extention)
   * @returns {String} the content of the partial file
   * * templateEngine.partialsPath must be set to the folder where this file is located
   */
  async _getIncludeInfo(partialName) {
    const path = `${this.partialsPath}/${partialName}.html`;
    try {
      const content = await this.readFileUtf8(path);
      return content;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  /**
   * Method to get the names of the partials used in the template
   * @param {String} template string in html format
   * @returns {Array} returns and array of the partial names
   * * example return [ "header", "footer" ]
   */
  _getPartialNames(template) {
    const partialNames = template.match(/{{include_(.*?)}}/g);

    if (!partialNames) return [];

    let names = [];

    for (const partial of partialNames) {
      names.push(
        partial
          .split(/{{include_|}}/)
          .filter(Boolean)[0]
          .trim(),
      );
    }

    return names;
  }

  /**
   * Method to replace the includes placeholder with the the include file content
   * @param {String} template the HTML template string
   * @param {Array} partials the array of partials
   * @returns {String} the HTML string with the included partial content
   */
  _replaceIncludes(template, partials) {
    template = template.replace(/{{include_(.*?)}}/g, (match, group) => {
      const partialName = group.trim();

      const content = partials.filter((partial) => {
        return partial.name === partialName;
      });

      return content[0].content;
    });

    return template;
  }

  /**
   * Read a utf8 file
   * @param {String} filepath path to the file
   * @returns {Promise} promise
   * * Resolves to the file content as a string
   * * Reject to a json error message
   */
  readFileUtf8(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, "utf8", (error, data) => {
        if (data) resolve(data);
        else
          reject({
            status: "error",
            message: `could not read file at path: ${filepath}`,
          });
      });
    });
  }
}

const templateEngine = new TemplateEngine();
module.exports = templateEngine;
