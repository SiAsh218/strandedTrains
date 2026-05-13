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
const form = document.querySelector(".modal-form");
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

  console.log(data);

  const formValid = myForm.isValid(form);
  if (!formValid.valid) {
    myAlert.render(formValid.message, "error", 3);
    return;
  }

  addStrandedTrain(formMode, data);

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
// Click listener for table rows and buttons
// =========================
document.addEventListener("click", async (e) => {
  const closeModal = e.target.closest(".modal-close");

  if (closeModal) {
    document.getElementById("modalBackdrop").classList.add("hidden");
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
    } else if (button.classList.contains("btn-delete")) {
      const databaseId = button.dataset.index;

      const confirmed = await myAlert.showConfirm(
        "Are you sure you want to delete this entry?",
        "Yes, delete it",
        "No, keep it",
      );

      if (confirmed) {
        await fetch(`/api/stranded-trains/${databaseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deleted: true }),
        });

        updateDurations();
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
  document.getElementById("modalBackdrop").classList.add("hidden");
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

  document.getElementById("modalBackdrop").classList.remove("hidden");
  form.scrollTop = 0;
};

const addStrandedTrain = async (mode, data) => {
  if (mode === "new") {
    const strandedTrains = await getStrandedTrains();
    data.priority = strandedTrains.length + 1; // New entries get lowest priority

    await fetch("/api/stranded-trains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } else {
    const id = form.dataset.databaseId;

    await fetch(`/api/stranded-trains/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // data.priority =
    //   data.priority <= index + 1 ? data.priority - 0.1 : data.priority + 0.1; // Adjust priority to ensure it moves to correct position after sorting
    // strandedTrains[index] = data;
  }
  updateDurations();
};

const setInputToNow = (input) => {
  const now = new Date();

  // Convert to local ISO format without seconds
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  input.value = localNow;
};

const getStrandedTrains = async () => {
  const response = await fetch(`/api/stranded-trains`, {
    method: "GET",
  });

  return await response.json();
};

const getStrandedTrainById = async (id) => {
  const response = await fetch(`/api/stranded-trains/${id}`, {
    method: "GET",
  });

  return await response.json();
};

const updateDurations = async () => {
  const strandedTrains = await getStrandedTrains();

  myTable.renderStrandedTrainsTable(strandedTrains);
};

updateDurations();

// LOOP TO UPDATE DURATIONS EVERY MINUTE
setInterval(updateDurations, 60000);
