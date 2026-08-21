const getUsers = async () => {
  const response = await fetch("/api/users");

  return response.json();
};

const getRoles = async () => {
  const response = await fetch("/api/roles");

  if (!response.ok) {
    throw new Error("Failed to load roles");
  }

  return response.json();
};

const getUserById = async (id) => {
  const response = await fetch(`/api/users/${id}`);

  return response.json();
};

const createUser = async (user) => {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  return response.json();
};

const updateUser = async (id, user) => {
  const response = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  return response.json();
};

const resetPassword = async (id, password) => {
  const response = await fetch(`/api/users/${id}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password,
    }),
  });

  return response.json();
};

export default {
  getUsers,
  getRoles,
  createUser,
  getUserById,
  updateUser,
  resetPassword,
};
