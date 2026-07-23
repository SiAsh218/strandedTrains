const db = require("./sqlite");

const getByUsername = (username) => {
  return db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE username = ?
      AND active = 1
    `,
    )
    .get(username);
};

const getById = (id) => {
  return db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE id = ?
    `,
    )
    .get(id);
};

const getAll = () => {
  return db
    .prepare(
      `
      SELECT
        id,
        username,
        role,
        active,
        createdAt,
        updatedAt
      FROM users
      ORDER BY username
    `,
    )
    .all();
};

const create = ({ username, passwordHash, role }) => {
  return db
    .prepare(
      `
      INSERT INTO users
      (
        username,
        passwordHash,
        role
      )
      VALUES (?, ?, ?)
    `,
    )
    .run(username, passwordHash, role);
};

const updatePassword = (id, passwordHash) => {
  console.log("Updating password", id);

  return db
    .prepare(
      `
      UPDATE users
      SET
        passwordHash = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(passwordHash, id);
};

const getActiveAdminCount = () => {
  const result = db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'admin'
      AND active = 1
    `,
    )
    .get();

  return result.count;
};

const setActive = (id, active) => {
  return db
    .prepare(
      `
      UPDATE users
      SET
        active = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(active, id);
};

const usernameExists = (username) => {
  return !!db
    .prepare(
      `
      SELECT id
      FROM users
      WHERE username = ?
    `,
    )
    .get(username);
};

const updateUser = (id, role, active) => {
  return db
    .prepare(
      `
      UPDATE users
      SET
        role = ?,
        active = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(role, active, id);
};

module.exports = {
  getByUsername,
  getById,
  getAll,
  create,
  updatePassword,
  setActive,
  usernameExists,
  updateUser,
  getActiveAdminCount,
};
