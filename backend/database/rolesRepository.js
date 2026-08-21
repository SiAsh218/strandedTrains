const db = require("./sqlite.js");

const getAll = () => {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        description,
        permissions,
        active,
        createdAt,
        updatedAt
      FROM roles
      ORDER BY name
      `,
    )
    .all();
};

const getActive = () => {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        description,
        permissions
      FROM roles
      WHERE active = 1
      ORDER BY name
      `,
    )
    .all();
};

const getByName = (name) => {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        description,
        permissions,
        active
      FROM roles
      WHERE name = ?
      `,
    )
    .get(name);
};

const create = ({ name, description, permissions }) => {
  return db
    .prepare(
      `
      INSERT INTO roles (
        name,
        description,
        permissions
      )
      VALUES (?, ?, ?)
      `,
    )
    .run(name, description || null, JSON.stringify(permissions || []));
};

const update = (id, { name, description, permissions, active }) => {
  return db
    .prepare(
      `
      UPDATE roles
      SET
        name = ?,
        description = ?,
        permissions = ?,
        active = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
    )
    .run(
      name,
      description || null,
      JSON.stringify(permissions || []),
      active,
      id,
    );
};

const getPermissions = (roleName) => {
  const role = getByName(roleName);

  if (!role) {
    return [];
  }

  try {
    return JSON.parse(role.permissions);
  } catch (error) {
    console.error(`Invalid permissions JSON for role "${roleName}"`, error);

    return [];
  }
};

const hasPermission = (roleName, permission) => {
  const permissions = getPermissions(roleName);

  return permissions.includes(permission);
};

module.exports = {
  getAll,
  getActive,
  getByName,
  create,
  update,
  getPermissions,
  hasPermission,
};
