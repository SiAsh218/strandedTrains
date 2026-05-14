// =========================
// Stranded Trains - Frontend Script
// This file contains the main JavaScript logic for the frontend,
// including event listeners and functions for handling user interactions.
// =========================

// =========================
// Import dependencies
// =========================
import myAlert from "./alert";
import myTable from "./table";
import myForm from "./form";

// =========================
// DOM ELEMENTS
// =========================
const form = document.querySelector(".modal-form--stranded-trains");
const loginForm = document.querySelector(".modal-form--login");
const statusSelect = form.querySelector("#input--status");
const strandedAtInput = form.querySelector("#input--stranded-at");
const rescuedAtInput = form.querySelector("#input--rescued-at");
const devTimeInput = document.getElementById("date-time--dev");

// =========================
// Event Listeners
// =========================

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

  const strandedTrains = await getStrandedTrains();

  strandedTrains.sort((a, b) => a.priority - b.priority);

  // Update priorities based on current order in array
  for (let i = 0; i < strandedTrains.length; i++) {
    const train = strandedTrains[i];
    train.priority = i + 1;
  }

  myTable.renderStrandedTrainsTable(strandedTrains);
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
    window.location.reload();
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
      openModal();
    } else if (button.id === "btn-login") {
      document.getElementById("modalLoginBackdrop").classList.remove("hidden");
    } else if (button.classList.contains("btn-delete")) {
      const databaseId = button.dataset.index;

      const confirmed = await myAlert.showConfirm(
        "Are you sure you want to delete this entry?",
        "Yes, delete it",
        "No, keep it",
      );

      if (confirmed) {
        try {
          const res = await fetch(`/api/stranded-trains/${databaseId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ deleted: true }),
          });

          const result = await res.json();

          if (!res.ok) {
            myAlert.render(
              result.error || "Failed to delete entry",
              "error",
              3,
            );

            return;
          }

          await updateDurations();
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

    const strandedTrain = await getStrandedTrainById(id);

    // const data = strandedTrains[index];
    myForm.setFormMode(form, "edit");
    myForm.setId(form, id);
    openModal();

    myForm.setFormData(form, strandedTrain);
  }
});

// =========================
// Change listener for status select - enables/disables rescuedAt input based on status
// =========================
statusSelect.addEventListener("change", (e) => {
  const value = statusSelect.value;
  if (value === "Rescued") {
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
  const strandedTrains = await getStrandedTrains();

  myTable.renderStrandedTrainsTable(strandedTrains);
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
  if (form.dataset.mode === "new") {
    setInputToNow(strandedAtInput);
    document.getElementById("form-group--priority").classList.add("hidden");
  } else {
    document.getElementById("form-group--priority").classList.remove("hidden");
  }

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
      const strandedTrains = await getStrandedTrains();
      data.priority = strandedTrains.length + 1; // New entries get lowest priority

      const res = await fetch("/api/stranded-trains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        myAlert.render(result.error || "Failed to create entry", "error", 3);

        return;
      }
    } else {
      const id = form.dataset.databaseId;

      const res = await fetch(`/api/stranded-trains/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        myAlert.render(result.error || "Failed to create entry", "error", 3);

        return;
      }

      // data.priority =
      //   data.priority <= index + 1 ? data.priority - 0.1 : data.priority + 0.1; // Adjust priority to ensure it moves to correct position after sorting
      // strandedTrains[index] = data;
    }
    await updateDurations();
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

const login = async (username, password) => {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
      credentials: "include",
    });

    return await response.json();
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error: "Login failed due to network error" };
  }
};

const getStrandedTrains = async () => {
  try {
    const response = await fetch(`/api/stranded-trains`, {
      method: "GET",
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching stranded trains:", error);
    myAlert.render("Failed to fetch stranded trains", "error", 3);
    return [];
  }
};

const getStrandedTrainById = async (id) => {
  try {
    const response = await fetch(`/api/stranded-trains/${id}`, {
      method: "GET",
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching stranded train by ID:", error);
    myAlert.render("Failed to fetch stranded train details", "error", 3);
    return null;
  }
};

const updateDurations = async () => {
  try {
    const strandedTrains = await getStrandedTrains();

    myTable.renderStrandedTrainsTable(strandedTrains);
  } catch (error) {
    console.error("Error updating durations:", error);
    myAlert.render("Failed to update durations", "error", 3);
  }
};

// Utility method to hide edit buttons for users who are not logged in
const hideEditButtons = () => {
  return document.getElementById("btn-add").classList.contains("hidden");
};

await updateDurations();

// LOOP TO UPDATE DURATIONS EVERY MINUTE
setInterval(await updateDurations(), 60000);
