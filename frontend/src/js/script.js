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
const buttonCopyToClipboard = document.getElementById("btn-copy-to-clipboard");

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

  // const strandedTrains = await getStrandedTrains();

  // strandedTrains.sort((a, b) => a.priority - b.priority);

  // // Update priorities based on current order in array
  // for (let i = 0; i < strandedTrains.length; i++) {
  //   const train = strandedTrains[i];
  //   train.priority = i + 1;
  // }

  // myTable.renderStrandedTrainsTable(strandedTrains);
  updateDurations();
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
    document.getElementById("btn-add").classList.remove("hidden");
    updateDurations();
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
      openModal();
    } else if (button.id === "btn-login") {
      document.getElementById("modalLoginBackdrop").classList.remove("hidden");
    } else if (button.id === "btn-copy-to-clipboard") {
      copyToClipboard();
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

    if (!strandedTrain) {
      return;
    }

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
  // const strandedTrains = await getStrandedTrains();

  // myTable.renderStrandedTrainsTable(strandedTrains);
  updateDurations();
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
        myAlert.render(result.error || "Failed to update entry", "error", 3);

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

    if (!response.ok) throw new Error("Failed to fetch stranded trains");

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

    if (!response.ok) throw new Error("Failed to fetch stranded train by ID");

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

    if (strandedTrains.length === 0) {
      document.querySelector(".popup").classList.remove("hidden");
      document.querySelector(".table--stranded-trains").classList.add("hidden");
    } else {
      document.querySelector(".popup").classList.add("hidden");
      document
        .querySelector(".table--stranded-trains")
        .classList.remove("hidden");
      myTable.renderStrandedTrainsTable(strandedTrains);
    }
  } catch (error) {
    console.error("Error updating durations:", error);
    myAlert.render("Failed to update durations", "error", 3);
  }
};

// Utility method to hide edit buttons for users who are not logged in
const hideEditButtons = () => {
  return document.getElementById("btn-add").classList.contains("hidden");
};

const getDataForCopyToTyrell = (data) => {
  console.log("Generating data for copy to Tyrell with input:", data);
  return `<b>${data.headcode}</b> is <b>${data.status}</b> at <b>${data.location}</b> ${data.locationW3W ? `(W3W - ${data.locationW3W})` : ""}<br><br>
  
  <b>Train Info:</b><br>
  ${data.strandedAt ? `Stranded At - ${new Date(data.strandedAt).toLocaleString()}<br>` : ""}
  ${data.traction ? `Traction - ${data.traction}<br>` : ""}}

  <b>Passenger Info:</b><br>
  ${data.passengerCount ? `${data.passengerCount} Passengers<br>` : ""}
  ${data.passengerLoading ? `${data.passengerLoading} - Passenger Loading<br>` : ""}
  ${data.vulnerablePeople ? `${data.vulnerablePeople} Vulnerable People<br>` : ""}
  ${data.noOfStaff ? `${data.noOfStaff} Staff Identified Onboard<br>` : ""}
  ${data.moodOnboard ? `Mood Onboard - ${data.moodOnboard}<br>` : ""}
  <br>
  
  <b>Facilities:</b><br>
  ${data.toiletsWorking ? `Toilets - ${data.toiletsWorking}<br>` : ""}
  ${data.heatingRequired ? `Heating - ${data.heatingRequired}<br>` : ""}
  ${data.airCoolingRequired ? `Air Cooling - ${data.airCoolingRequired}<br>` : ""}
  ${data.lighting ? `Lighting - ${data.lighting}<br>` : ""}
  ${data.paWorking ? `PA System - ${data.paWorking}<br>` : ""}
  ${data.cateringAvailable ? `Catering - ${data.cateringAvailable}<br>` : ""}
  <br>

  ${data.tolo ? `<b>TOLO:</b> ${data.tolo}<br><br>` : ""}

  ${data.additionalInformation ? `<b>Additional Information:</b><br>${data.additionalInformation}<br><br>` : ""}
  `;
};

const fallbackCopyRichText = (html) => {
  const div = document.createElement("div");

  div.innerHTML = html;
  div.contentEditable = true;

  div.style.position = "fixed";
  div.style.left = "-9999px";

  document.body.appendChild(div);

  const range = document.createRange();
  range.selectNodeContents(div);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const success = document.execCommand("copy");

  selection.removeAllRanges();
  document.body.removeChild(div);

  return success;
};

const copyToClipboard = async () => {
  const html = getDataForCopyToTyrell(myForm.getFormData());

  try {
    if (
      navigator.clipboard &&
      navigator.clipboard.write &&
      window.ClipboardItem
    ) {
      const blob = new Blob([html], { type: "text/html" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
        }),
      ]);
    } else {
      fallbackCopyRichText(html);
    }

    myAlert.render("Data copied to clipboard", "success", 2);
  } catch (err) {
    console.error(err);
    myAlert.render("Failed to copy to clipboard", "error", 2);
  }
};

const startSynchronizedUpdates = () => {
  const now = new Date();

  // Milliseconds until next minute
  const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    updateDurations(); // Run exactly on the minute

    setInterval(() => {
      updateDurations();
    }, 60000);
  }, delay);
};

updateDurations();

// LOOP TO UPDATE DURATIONS EVERY MINUTE
startSynchronizedUpdates();
