// =========================
// Stranded Trains - Backend Database Abstraction Layer
// This file contains the logic for abstracting away the database implementation,
// allowing for easy switching between different database types in the future if needed.
// =========================

// =========================
// Import dependencies
// =========================
const sqlite = require("./sqlite.js");

class Database {
  constructor() {
    this.db = sqlite;
  }

  async initialise() {
    return this.db.initialise();
  }

  async insert(table, data) {
    return this.db.insert(table, data);
  }

  async update(table, id, data) {
    return this.db.update(table, id, data);
  }

  async getAll(table) {
    return this.db.getAll(table);
  }

  async getWhere(table, whereClause, values = []) {
    return sqlite.getWhere(table, whereClause, values);
  }

  async getById(table, id) {
    return this.db.getById(table, id);
  }

  async delete(table, id) {
    return this.db.delete(table, id);
  }
}

module.exports = new Database();
