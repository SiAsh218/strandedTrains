import userService from "../services/userService.js";
import myAlert from "../js/alert.js";

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

const initUserAdmin = () => {
  const adminButton = document.getElementById("btn-users");

  adminButton.addEventListener("click", async (e) => {
    const users = await userService.getUsers();

    renderUsers(users);

    document.getElementById("create-user-username").value = "";
    document.getElementById("create-user-password").value = "";
    document.getElementById("modalUsersBackdrop").classList.remove("hidden");
  });

  document
    .getElementById("form-create-user")
    .addEventListener("submit", async (e) => {
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

      const users = await userService.getUsers();
      renderUsers(users);

      e.target.reset();
    });

  document
    .getElementById("form-edit-user")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("edit-user-id").value;
      const role = document.getElementById("edit-user-role").value;
      const active = document.getElementById("edit-user-active").checked
        ? 1
        : 0;

      const result = await userService.updateUser(id, {
        role,
        active,
      });

      if (!result.success) {
        myAlert.render(result.error || "Failed to update user", "error", 3);
        return;
      }

      myAlert.render("User updated", "success", 3);

      const users = await userService.getUsers();
      renderUsers(users);

      document.getElementById("modalEditUserBackdrop").classList.add("hidden");
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

export { initUserAdmin, handleEditUser, handleResetPassword };
