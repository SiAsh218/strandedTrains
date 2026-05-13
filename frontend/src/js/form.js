class Form {
  constructor() {}

  getFormMode(form) {
    return form.dataset.mode;
  }

  setFormMode(form, mode) {
    form.dataset.mode = mode;
  }

  setId(form, id) {
    form.dataset.databaseId = id;
  }

  lastUpdatedInfoChanged() {
    const timeChanged = this.hasInputChanged(
      document.getElementById("input--last-contact-time"),
    );
    const personChanged = this.hasInputChanged(
      document.getElementById("input--last-contact-person"),
    );
    return timeChanged || personChanged;
  }

  formatLastUpdatedInfo() {
    const time = this.getInputValuebyId("input--last-contact-time");
    const person = this.getInputValuebyId("input--last-contact-person");

    if (time && person) {
      return `${this.formatDateTime(time)} - ${person}`;
    } else if (time) {
      return this.formatDateTime(time);
    } else if (person) {
      return person;
    } else {
      return "";
    }
  }

  getAllRequiredLabels(form) {
    return form.querySelectorAll("label.required");
  }

  isValid(form) {
    const requiredLabels = this.getAllRequiredLabels(form);

    for (const label of requiredLabels) {
      const inputId = label.getAttribute("for");
      const input = document.getElementById(inputId);
      if (input && !input.value.trim()) {
        const errorMessage =
          label.dataset.error || "Please Complete All Required Fields";
        return { valid: false, message: errorMessage };
      }
    }

    return { valid: true };
  }

  getFormData() {
    return {
      priority: Number(this.getInputValuebyId("input--priority")),
      headcode: this.getInputValuebyId("input--headcode"),
      location: this.getInputValuebyId("input--location"),
      locationW3W: this.getInputValuebyId("input--location-w3w"),
      traction: this.getInputValuebyId("input--traction"),
      strandedAt: this.getInputValuebyId("input--stranded-at"),
      contact: this.getInputValuebyId("input--contact"),
      contactNo: this.getInputValuebyId("input--contact-no"),
      responder: this.getInputValuebyId("input--responder"),
      responderNo: this.getInputValuebyId("input--responder-no"),
      ccilRef: this.getInputValuebyId("input--ccil-ref"),
      status: this.getInputValuebyId("input--status"),
      moodOnboard: this.getInputValuebyId("input--mood-onboard"),
      rescuedAt: this.getInputValuebyId("input--rescued-at"),
      passengerLoading: this.getInputValuebyId("input--passenger-loading"),
      passengerCount: this.getInputValuebyId("input--passenger-count"),
      toiletsWorking: this.getInputValuebyId("input--toilets-working"),
      noOfStaff: this.getInputValuebyId("input--number-of-staff"),
      vulnerablePeople: this.getInputValuebyId("input--vulnerable-people"),
      tolo: this.getInputValuebyId("input--tolo"),
      heatingRequired: this.getInputValuebyId("input--heating-required"),
      airCoolingRequired: this.getInputValuebyId("input--air-cooling-required"),
      lighting: this.getInputValuebyId("input--lighting"),
      strandedTrainChampion: this.getInputValuebyId(
        "input--stranded-train-champion",
      ),
      championNo: this.getInputValuebyId("input--champion-no"),
      otherAffectedTrains: this.getInputValuebyId(
        "input--other-affected-trains",
      ),
      planA: this.getInputValuebyId("input--plan-a"),
      planB: this.getInputValuebyId("input--plan-b"),
      planC: this.getInputValuebyId("input--plan-c"),
      additionalInformation: this.getInputValuebyId(
        "input--additional-information",
      ),
      lastContact: this.getInputValuebyId("input--last-contact-time"),
      lastContactPerson: this.getInputValuebyId("input--last-contact-person"),
      contactRecord:
        `${this.getInputValuebyId("input--contact-record")}${this.lastUpdatedInfoChanged() ? `\n${this.formatLastUpdatedInfo()}` : ""}`.trim(),
      showDeletionFlag: this.getInputValuebyId("input--status") === "Rescued",
      lastUpdated: new Date().toISOString(),
    };
  }

  setFormData(form, data) {
    form.querySelector("#input--priority").value = data.priority;
    form.querySelector("#input--headcode").value = data.headcode;
    form.querySelector("#input--location").value = data.location;
    form.querySelector("#input--location-w3w").value = data.locationW3W;
    form.querySelector("#input--traction").value = data.traction;
    form.querySelector("#input--stranded-at").value = data.strandedAt;
    form.querySelector("#input--contact").value = data.contact;
    form.querySelector("#input--contact-no").value = data.contactNo;
    form.querySelector("#input--responder").value = data.responder;
    form.querySelector("#input--responder-no").value = data.responderNo;
    form.querySelector("#input--ccil-ref").value = data.ccilRef;
    form.querySelector("#input--status").value = data.status;
    form.querySelector("#input--mood-onboard").value = data.moodOnboard;
    form.querySelector("#input--rescued-at").value = data.rescuedAt;
    form.querySelector("#input--passenger-loading").value =
      data.passengerLoading;
    form.querySelector("#input--passenger-count").value = data.passengerCount;
    form.querySelector("#input--toilets-working").value = data.toiletsWorking;
    form.querySelector("#input--number-of-staff").value = data.noOfStaff;
    form.querySelector("#input--vulnerable-people").value =
      data.vulnerablePeople;
    form.querySelector("#input--tolo").value = data.tolo;
    form.querySelector("#input--heating-required").value = data.heatingRequired;
    form.querySelector("#input--air-cooling-required").value =
      data.airCoolingRequired;
    form.querySelector("#input--lighting").value = data.lighting;
    form.querySelector("#input--stranded-train-champion").value =
      data.strandedTrainChampion;
    form.querySelector("#input--champion-no").value = data.championNo;
    form.querySelector("#input--other-affected-trains").value =
      data.otherAffectedTrains;
    form.querySelector("#input--plan-a").value = data.planA;
    form.querySelector("#input--plan-b").value = data.planB;
    form.querySelector("#input--plan-c").value = data.planC;
    form.querySelector("#input--additional-information").value =
      data.additionalInformation;
    this.setInputDefaultValue(
      form.querySelector("#input--last-contact-time"),
      data.lastContact,
    );
    this.setInputDefaultValue(
      form.querySelector("#input--last-contact-person"),
      data.lastContactPerson,
    );
    form.querySelector("#input--contact-record").value = data.contactRecord;
    form.querySelector("#input--last-updated").value = new Date(
      data.lastUpdated,
    ).toLocaleString();
    form.querySelector("#form-group--last-updated").classList.remove("hidden");
  }

  /**
   * Format a date/time input into:
   * "dd MMM yyyy HH:mm" (e.g. "05 Feb 2026 14:32")
   *
   * @param {string|Date|null|undefined} input
   * @returns {string} Formatted date string or empty string if invalid
   */
  formatDateTime(input) {
    if (!input) return "";

    const date = new Date(input);
    if (isNaN(date)) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }

  getInputValuebyId(id) {
    return document.getElementById(id).value;
  }

  setInputDefaultValue(input, value) {
    input.value = value;
    input.dataset.defaultValue = value;
  }

  hasInputChanged(input) {
    if (input.value != input.dataset.defaultValue) {
      return true;
    } else {
      return false;
    }
  }
}

export default new Form();
