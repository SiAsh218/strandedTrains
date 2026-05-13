// =========================
// Stranded Trains - Backend Stranded Train Model
// This file contains the logic for interacting with the database to perform CRUD operations on stranded train data,
// including normalisation of data before saving to the database.
// =========================

// =========================
// Import dependencies
// =========================
const db = require("../database/database.js");

// =========================
// Table name constant
// =========================
const TABLE = "stranded_trains";

class StrandedTrainModel {
  async create(data) {
    return db.insert(TABLE, this.normaliseData(data));
  }

  async update(id, data) {
    return db.update(TABLE, id, this.normaliseData(data));
  }

  async getAll() {
    return await db.getAll(TABLE);
  }

  async getActive() {
    return await db.getWhere(TABLE, "deleted = ?", [0]);
  }

  async getById(id) {
    return await db.getById(TABLE, id);
  }

  async delete(id) {
    return db.delete(TABLE, id);
  }

  /**
   * Normalises the data before saving to the database
   * @param {*} data The data to normalise
   * @returns {Object} The normalised data
   */
  normaliseData(data) {
    const normalisedData = {};

    for (const [key, value] of Object.entries(data)) {
      // Convert booleans to 1/0
      if (typeof value === "boolean") {
        normalisedData[key] = value ? 1 : 0;
        continue;
      }

      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        normalisedData[key] = value.toISOString();
        continue;
      }

      // Convert arrays/objects to JSON strings
      if (typeof value === "object" && value !== null) {
        normalisedData[key] = JSON.stringify(value);
        continue;
      }

      // Keep primitive values unchanged
      normalisedData[key] = value;
    }

    return normalisedData;
  }
}

module.exports = new StrandedTrainModel();
