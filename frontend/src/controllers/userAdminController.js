import userService from "../services/userService.js";
import myAlert from "../js/alert.js";

const initUserAdmin = () => {
  document
    .getElementById("btn-users")
    .addEventListener("click", handleOpenUserAdmin);

  document
    .getElementById("form-create-user")
    .addEventListener("submit", handleCreateUser);

  document
    .getElementById("form-edit-user")
    .addEventListener("submit", handleUpdateUser);

  document
    .getElementById("input-user-search")
    .addEventListener("input", filterUsersTable);
};

const handleOpenUserAdmin = async () => {
  await refreshUsersTable();

  clearUserSearch();

  document.getElementById("create-user-username").value = "";
  document.getElementById("create-user-password").value = "";

  document.getElementById("modalUsersBackdrop").classList.remove("hidden");
};

const handleCreateUser = async (e) => {
  e.preventDefault();

  const result = await userService.createUser({
    username: document.getElementById("create-user-username").value,
    password: document.getElementById("create-user-password").value,
    role: document.getElementById("user-role").value,
  });

  if (!result.success) {
    myAlert.render(result.error, "error", 3);
    return;
  }

  myAlert.render("User created", "success", 2);

  await refreshUsersTable();

  e.target.reset();
};

const handleUpdateUser = async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-user-id").value;

  const role = document.getElementById("edit-user-role").value;

  const active = document.getElementById("edit-user-active").checked ? 1 : 0;

  const result = await userService.updateUser(id, {
    role,
    active,
  });

  if (!result.success) {
    myAlert.render(result.error || "Failed to update user", "error", 3);
    return;
  }

  myAlert.render("User updated", "success", 3);

  await refreshUsersTable();

  document.getElementById("modalEditUserBackdrop").classList.add("hidden");
};

const renderUsers = (users) => {
  const tbody = document.getElementById("table-users-body");

  tbody.innerHTML = "";

  users.forEach((user) => {
    tbody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>${user.active ? "Active" : "Disabled"}</td>
        <td>
          <button
            class="btn btn-edit-user"
            type="button"
            data-id="${user.id}"
          >
            Edit
          </button>
        </td>
      </tr>
      `,
    );
  });
};

const handleEditUser = async (button) => {
  const user = await userService.getUserById(button.dataset.id);

  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-username").value = user.username;
  document.getElementById("edit-user-role").value = user.role;
  document.getElementById("edit-user-active").checked = !!user.active;

  document.getElementById("modalEditUserBackdrop").classList.remove("hidden");
};

const handleResetPassword = async () => {
  const id = document.getElementById("edit-user-id").value;

  const password = document.getElementById("edit-user-password").value;

  if (!password) {
    myAlert.render("Please enter a password", "error", 3);
    return;
  }

  const result = await userService.resetPassword(id, password);

  if (!result.success) {
    myAlert.render(result.error || "Password reset failed", "error", 3);
    return;
  }

  document.getElementById("edit-user-password").value = "";

  myAlert.render("Password reset successfully", "success", 3);
};

const filterUsersTable = () => {
  const search = document
    .getElementById("input-user-search")
    .value.toLowerCase()
    .trim();

  const rows = document.querySelectorAll("#table-users-body tr");

  rows.forEach((row) => {
    const username = row.cells[0]?.textContent.toLowerCase() ?? "";

    const role = row.cells[1]?.textContent.toLowerCase() ?? "";

    const matches = username.includes(search) || role.includes(search);

    row.style.display = matches ? "" : "none";
  });
};

const refreshUsersTable = async () => {
  const users = await userService.getUsers();

  renderUsers(users);

  filterUsersTable();
};

const clearUserSearch = () => {
  const searchInput = document.getElementById("input-user-search");

  if (!searchInput) return;

  searchInput.value = "";

  filterUsersTable();
};

export { initUserAdmin, handleEditUser, handleResetPassword };
