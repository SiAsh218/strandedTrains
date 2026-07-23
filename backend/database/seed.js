const bcrypt = require("bcrypt");
const db = require("./sqlite.js");

const seedAdminUser = async () => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();

  if (userCount.count > 0) {
    return;
  }

  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  db.prepare(
    `
    INSERT INTO users
    (
      username,
      passwordHash,
      role
    )
    VALUES (?, ?, ?)
  `,
  ).run("admin", passwordHash, "admin");

  console.log("Default admin user created");
};

module.exports = {
  seedAdminUser,
};
