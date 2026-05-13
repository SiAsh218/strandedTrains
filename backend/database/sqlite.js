const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

class SQLiteDatabase {
  constructor() {
    // Always use absolute path to avoid nodemon / working directory issues
    const dbPath = path.join(__dirname, "app.db");

    this.db = new Database(dbPath);

    console.log("SQLite connected:", dbPath);
  }

  /**
   * Initialise database schema
   * @param {boolean} force - if true, drops existing tables before recreating
   */
  async initialise(force = false) {
    const schemaPath = path.join(__dirname, "schemas", "stranded_trains.sql");

    let schema = fs.readFileSync(schemaPath, "utf8");

    const tableExists = this.tableExists("stranded_trains");

    if (force || !tableExists) {
      console.log("Resetting database schema...");

      // Add ALL tables here you want to reset
      if (force && tableExists) {
        this.db.exec(`
        DROP TABLE IF EXISTS stranded_trains;
      `);
      }
    }

    this.db.exec(schema);

    console.log("Database initialised");
  }

  insert(table, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(",");

    const sql = `
      INSERT INTO ${table}
      (${columns.join(",")})
      VALUES (${placeholders})
    `;

    return this.db.prepare(sql).run(Object.values(data));
  }

  update(table, id, data) {
    const columns = Object.keys(data);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = ?
    `;

    return this.db.prepare(sql).run([...Object.values(data), id]);
  }

  getAll(table) {
    return this.db.prepare(`SELECT * FROM ${table}`).all();
  }

  getById(table, id) {
    return this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  }

  delete(table, id) {
    return this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  }

  async getWhere(table, whereClause, values = []) {
    const sql = `
    SELECT *
    FROM ${table}
    WHERE ${whereClause}
  `;

    return this.db.prepare(sql).all(values);
  }

  tableExists(tableName) {
    const sql = `
    SELECT name
    FROM sqlite_master
    WHERE type='table'
    AND name = ?
  `;

    const result = this.db.prepare(sql).get(tableName);

    return !!result;
  }
}

module.exports = new SQLiteDatabase();
