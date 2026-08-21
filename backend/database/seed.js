const bcrypt = require("bcrypt");
const db = require("./sqlite.js");
const rolesRepository = require("./rolesRepository.js");

const seedRoles = () => {
  const roles = [
    {
      name: "admin",
      description: "Full system administrator",
      permissions: ["read", "write", "admin"],
    },
    {
      name: "gwr",
      description: "GWR user",
      permissions: ["read", "write"],
    },
    {
      name: "xc",
      description: "CrossCountry user",
      permissions: ["read", "write"],
    },
    {
      name: "gts",
      description: "GTS user",
      permissions: ["read", "write"],
    },
    {
      name: "viewer",
      description: "Read-only user",
      permissions: ["read"],
    },
  ];

  for (const role of roles) {
    const existingRole = rolesRepository.getByName(role.name);

    if (!existingRole) {
      rolesRepository.create(role);
    }
  }
};

const seedUsers = async () => {
  const users = [
    {
      username: "admin",
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    },
    {
      username: "vieweruser",
      password: process.env.VIEWER_PASSWORD,
      role: "viewer",
    },
    {
      username: "gwruser1",
      password: process.env.GWR_PASSWORD,
      role: "gwr",
    },
    {
      username: "xcuser2",
      password: process.env.XC_PASSWORD,
      role: "xc",
    },
    {
      username: "gtsuser3",
      password: process.env.GTS_PASSWORD,
      role: "gts",
    },
    // {
    //   username: "testuser",
    //   password: process.env.TEST_USER_PASSWORD,
    //   role: "gwr",
    // },
  ];

  for (const user of users) {
    const existingUser = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(user.username);

    if (existingUser) {
      continue;
    }

    if (!user.password) {
      throw new Error(`Password not provided for ${user.username}`);
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

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
    ).run(user.username, passwordHash, user.role);

    console.log(`Created user: ${user.username}`);
  }
};

module.exports = {
  seedRoles,
  seedUsers,
};
