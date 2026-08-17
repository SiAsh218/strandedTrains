// =========================
// Stranded Trains - Backend Template Engine
// =========================

const fs = require("fs");

class TemplateEngine {
  constructor() {
    this.viewPath = "";
    this.partialsPath = "";
  }

  /**
   * Generate final HTML
   */
  async getFinalHTML(template, data) {
    const partials = await this._getPartials(template);

    template = this._replaceIncludes(template, partials);

    return this._convertTemplate(template, data);
  }

  /**
   * Convert template into final HTML
   */
  _convertTemplate(template, data) {
    for (const key in data) {
      if (Array.isArray(data[key])) {
        template = this._handleArray(template, data, key);
      } else if (typeof data[key] === "boolean") {
        template = this._handleBoolean(template, data, key);
      } else {
        template = this._replaceObjectPlaceholders(template, data);
        template = this._replacePlaceholders(template, key, data[key]);
      }
    }

    return template;
  }

  /**
   * Escape HTML output
   */
  _escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Handle arrays
   */
  _handleArray(template, data, key) {
    const itemTemplateMatch = template.match(
      new RegExp(`{{${key}_template}}(.*?){{/${key}_template}}`, "s"),
    );

    const itemTemplate = itemTemplateMatch ? itemTemplateMatch[1] : "";

    const itemHTML = data[key].reduce((acc, item) => {
      return acc + this._convertTemplate(itemTemplate, item);
    }, "");

    return template.replace(
      new RegExp(`{{${key}_template}}.*?{{/${key}_template}}`, "s"),
      itemHTML,
    );
  }

  /**
   * Handle booleans
   */
  _handleBoolean(template, data, key) {
    const value = data[key];

    const startExp = new RegExp(`{{if_${key}}}`, "s");
    const endExp = new RegExp(`{{/if_${key}}}`, "s");

    const startIndex = template.search(startExp);
    const endIndex = template.search(endExp);

    if (startIndex === -1 || endIndex === -1) {
      return template;
    }

    let content = template.substring(
      startIndex + `{{if_${key}}}`.length,
      endIndex,
    );

    if (value && content.includes("{{else}}")) {
      content = content.split("{{else}}")[0].trim();
    }

    if (!value && !content.includes("{{else}}")) {
      content = "";
    } else if (!value && content.includes("{{else}}")) {
      content = content.split("{{else}}")[1].trim();
    }

    return template.replace(
      template.substring(startIndex, endIndex + `{{/if_${key}}}`.length),
      content,
    );
  }

  /**
   * Replace simple placeholders
   */
  _replacePlaceholders(template, key, value) {
    return template.replace(
      new RegExp(`{{${key}}}`, "sg"),
      this._escapeHtml(value ?? ""),
    );
  }

  /**
   * Replace object placeholders
   */
  _replaceObjectPlaceholders(template, data) {
    return template.replace(/{{(\w+(?:\.\w+)*)}}/g, (match, key) => {
      let value = data;

      for (const part of key.split(".")) {
        value = value?.[part];

        if (value === undefined) {
          break;
        }
      }

      return value !== undefined ? this._escapeHtml(value) : match;
    });
  }

  /**
   * Load partials
   */
  async _getPartials(template) {
    const partialNames = this._getPartialNames(template);

    const partials = [];

    for (const name of partialNames) {
      const content = await this._getIncludeInfo(name);

      partials.push({
        name,
        content,
      });
    }

    return partials;
  }

  /**
   * Read include file
   */
  async _getIncludeInfo(partialName) {
    const path = `${this.partialsPath}/${partialName}.html`;

    return this.readFileUtf8(path);
  }

  /**
   * Find partial names
   */
  _getPartialNames(template) {
    const partialNames = template.match(/{{include_(.*?)}}/g);

    if (!partialNames) {
      return [];
    }

    return partialNames.map((partial) =>
      partial
        .split(/{{include_|}}/)
        .filter(Boolean)[0]
        .trim(),
    );
  }

  /**
   * Replace includes
   */
  _replaceIncludes(template, partials) {
    return template.replace(/{{include_(.*?)}}/g, (match, group) => {
      const partialName = group.trim();

      const partial = partials.find((p) => p.name === partialName);

      return partial?.content || "";
    });
  }

  /**
   * Read UTF-8 file
   */
  readFileUtf8(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, "utf8", (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data);
      });
    });
  }
}

const templateEngine = new TemplateEngine();

module.exports = templateEngine;
