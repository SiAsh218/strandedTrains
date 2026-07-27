// =========================
// Stranded Trains - Frontend Script
// This file contains the main JavaScript logic for the frontend,
// including event listeners and functions for handling user interactions.
// =========================

// =========================
// Import dependencies
// =========================

import { io } from "socket.io-client";

import myAlert from "./alert";
import myTable from "./table";
import myForm from "./form";
import printHandler from "./printHandler";
import {
  initUserAdmin,
  handleEditUser,
  handleResetPassword,
} from "../controllers/userAdminController.js";

import { login, getCurrentUser, logout } from "../services/authService.js";
import strandedTrainsService from "../services/strandedTrainsService.js";
import tyrellClipboardService from "../services/tyrellClipboardService.js";

// =========================
// DOM ELEMENTS
// =========================
const form = document.querySelector(".modal-form--stranded-trains");
const loginForm = document.querySelector(".modal-form--login");
const statusSelect = form.querySelector("#input--status");
const strandedAtInput = form.querySelector("#input--stranded-at");
const rescuedAtInput = form.querySelector("#input--rescued-at");
const devTimeInput = document.getElementById("date-time--dev");

let strandedTrains = [];

// =========================
// Event Listeners
// =========================

initUserAdmin();

// =========================
// Form submit listener - handles both create and update based on form mode
// =========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target.closest("form");

  const formMode = myForm.getFormMode(form);

  const data = myForm.getFormData();

  if (process.env.NODE_ENV === "development") {
    console.log(data);
  }

  const formValid = myForm.isValid(form);
  if (!formValid.valid) {
    myAlert.render(formValid.message, "error", 3);
    return;
  }

  await addStrandedTrain(formMode, data);

  closeModal();
});

// =========================
// Login form submit listener
// =========================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target.closest("form");

  const username = form.querySelector("#input--username").value;
  const password = form.querySelector("#input--password").value;

  const result = await login(username, password);

  if (!result.success) {
    myAlert.render(result.error, "error", 3);
    return;
  }

  if (result.success) {
    myAlert.render("Login successful!", "success", 2);
    window.location.href = "/";
    document.getElementById("btn-add").classList.remove("hidden");
    refreshData();
    // window.location.reload();
  }

  closeModal();
});

// =========================
// Click listener for table rows and buttons
// =========================
document.addEventListener("click", async (e) => {
  const closeModalEl = e.target.closest(".modal-close");

  if (closeModalEl) {
    closeModal();
    form.reset();
    return;
  }

  const button = e.target.closest("button");
  if (button) {
    if (button.id === "btn-add") {
      form.dataset.mode = "new";
      form.dataset.databaseId = "";
      form.querySelector("#form-group--last-updated").classList.add("hidden");
      form.querySelector("#form-group--created-by").classList.add("hidden");
      myForm.enableForm(form);
      setInputToNow(strandedAtInput);
      openModal();
      document.getElementById("input--headcode").focus();
    } else if (button.id === "btn-login") {
      document.getElementById("modalLoginBackdrop").classList.remove("hidden");
    } else if (button.id === "btn-logout") {
      const result = await logout();

      if (result.success) {
        document.getElementById("btn-add").classList.add("hidden");
        document.getElementById("btn-users").classList.add("hidden");
        window.location.href = "/";
      } else {
        myAlert.render("Logout Failed", "error", 3);
      }
    } else if (button.id === "btn-copy-to-clipboard") {
      await tyrellClipboardService.copyToClipboard(myForm.getFormData());
    } else if (button.id === "btn-print-stranded-train") {
      printHandler.deactivatePrintDivs();
      const div = document.getElementById("div-print--strandedTrains");
      printHandler.activatePrintDiv(div);

      const data = myForm.getFormData();

      printHandler.printStrandedTrain(data);
    } else if (button.classList.contains("btn-edit-user")) {
      await handleEditUser(button);
    } else if (button.id === "btn-reset-password") {
      await handleResetPassword();
    } else if (button.classList.contains("btn-delete")) {
      const databaseId = button.dataset.index;

      const confirmed = await myAlert.showConfirm(
        "Are you sure you want to delete this entry?",
        "Yes, delete it",
        "No, keep it",
      );

      if (confirmed) {
        try {
          const result =
            await strandedTrainsService.deleteStrandedTrain(databaseId);

          if (!result.success) {
            myAlert.render(
              result.result.error || "Failed to delete entry",
              "error",
              3,
            );

            return;
          }

          await refreshData();
        } catch (error) {
          console.error("Error deleting stranded train:", error);
          myAlert.render("Failed to delete stranded train", "error", 3);
        }
      }
    }
    return;
  }

  const row = e.target.closest(".table-row");
  if (row) {
    const id = row.dataset.databaseId;

    const response = await strandedTrainsService.getStrandedTrainById(id);

    if (response.unauthorized) {
      document.getElementById("modalLoginBackdrop").classList.remove("hidden");
      return;
    }

    const strandedTrain = response.data;

    if (!strandedTrain) {
      return;
    }

    // const data = strandedTrains[index];
    myForm.setFormMode(form, "edit");
    myForm.setId(form, id);

    const me = await getCurrentUser();

    if (me.role === "viewer") {
      myForm.disableForm(form);
    } else {
      myForm.enableForm(form);
    }

    openModal();

    myForm.setFormData(form, strandedTrain);
  }
});

// =========================
// Change listener for status select - enables/disables rescuedAt input based on status
// =========================
statusSelect.addEventListener("change", (e) => {
  const value = statusSelect.value;
  if (value === "Resolved") {
    setInputToNow(rescuedAtInput);
    document.getElementById("input--rescued-at").disabled = false;
  } else {
    rescuedAtInput.value = "";
    document.getElementById("input--rescued-at").disabled = true;
  }
});

// =========================
// Change listener for dev time input - updates durations in table based on selected time
// =========================
devTimeInput.addEventListener("change", async () => {
  // const strandedTrains = await getStrandedTrains();

  // myTable.renderStrandedTrainsTable(strandedTrains);
  refreshData();
});

// =========================
// Functions
// =========================
const closeModal = () => {
  // document.getElementById("modalBackdrop").classList.add("hidden");
  const modals = document.querySelectorAll(".modal-backdrop");
  modals.forEach((modal) => modal.classList.add("hidden"));

  form.reset();
  return;
};

const openModal = () => {
  // if (form.dataset.mode === "new") {
  //   setInputToNow(strandedAtInput);
  //   document.getElementById("form-group--priority").classList.add("hidden");
  // } else {
  //   document.getElementById("form-group--priority").classList.remove("hidden");
  // }

  if (hideEditButtons()) {
    document.querySelector(".modal-footer").classList.add("hidden");
  } else {
    document.querySelector(".modal-footer").classList.remove("hidden");
  }

  document.getElementById("modalBackdrop").classList.remove("hidden");
  form.scrollTop = 0;
};

const addStrandedTrain = async (mode, data) => {
  try {
    if (mode === "new") {
      const response = await strandedTrainsService.getStrandedTrains();

      if (response.unauthorized) {
        document
          .getElementById("modalLoginBackdrop")
          .classList.remove("hidden");

        return;
      }

      data.priority = response.data.length + 1;
    }

    const result = await strandedTrainsService.saveStrandedTrain(
      mode,
      form.dataset.databaseId,
      data,
    );

    if (!result.success) {
      myAlert.render(result.result.error || "Failed to save entry", "error", 3);

      return;
    }

    await refreshData();
  } catch (error) {
    console.error("Error adding/updating stranded train:", error);

    myAlert.render("Failed to save stranded train data", "error", 3);
  }
};

const setInputToNow = (input) => {
  const now = new Date();

  // Convert to local ISO format without seconds
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  input.value = localNow;
};

const refreshData = async () => {
  try {
    const response = await strandedTrainsService.getStrandedTrains();

    if (response.unauthorized) {
      document.getElementById("modalLoginBackdrop").classList.remove("hidden");

      return;
    }

    strandedTrains = response.data;

    renderTable();
  } catch (error) {
    console.error("Error refreshing data:", error);

    myAlert.render("Failed to refresh data", "error", 3);
  }
};

const renderTable = () => {
  if (strandedTrains.length === 0) {
    document.querySelector(".popup").classList.remove("hidden");

    document.querySelector(".table--stranded-trains").classList.add("hidden");

    return;
  }

  document.querySelector(".popup").classList.add("hidden");

  document.querySelector(".table--stranded-trains").classList.remove("hidden");

  myTable.renderStrandedTrainsTable(strandedTrains);
};

// Utility method to hide edit buttons for users who are not logged in
const hideEditButtons = () => {
  return document.getElementById("btn-users").classList.contains("hidden");
};

const startSynchronizedUpdates = () => {
  const now = new Date();

  const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    renderTable();

    setInterval(() => {
      renderTable();
    }, 60000);
  }, delay);
};

refreshData();

// LOOP TO UPDATE DURATIONS EVERY MINUTE
startSynchronizedUpdates();

const socket = io();

socket.on("connect", () => {
  // console.log("Socket connected");
});

socket.on("stranded-trains-updated", async () => {
  // console.log("Realtime update received");

  await refreshData();
});
