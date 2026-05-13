/**
 * Table utility class responsible for rendering
 * the Stranded Trains table and handling related
 * date/time formatting logic.
 *
 * Usage:
 *   import Table from "./Table.js";
 *   Table.renderStrandedTrainsTable(data);
 */
class Table {
  /**
   * Creates a new Table instance.
   * Caches reference to the stranded trains table element.
   */
  constructor() {
    /**
     * Reference to the stranded trains table element.
     * @type {HTMLTableElement|null}
     */
    this.tableStrandedTrains = document.querySelector(
      ".table--stranded-trains",
    );
  }

  /**
   * Render the stranded trains table body using provided data.
   *
   * @param {Array<Object>} data
   * Array of stranded train objects.
   *
   * Expected object structure:
   * {
   *   headcode: string,
   *   location: string,
   *   strandedAt: string|Date,
   *   rescuedAt?: string|Date,
   *   status: string,
   *   passengerLoading: string,
   *   toiletsWorking: string,
   *   vulnerablePeople: string,
   *   riskAssessment: string,
   *   plan: string,
   *   contact: string,
   *   showDeletionFlag: boolean
   * }
   *
   * @returns {void}
   */
  renderStrandedTrainsTable(data) {
    if (!this.tableStrandedTrains) return;

    const tableBody = this.tableStrandedTrains.querySelector("tbody");
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = "";

    let markup = "";

    // Build table rows
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      const strandedFormatted = this.formatDateTime(row.strandedAt);
      const rescuedFormatted = this.formatDateTime(row.rescuedAt);

      // If rescued → calculate diff between stranded and rescued
      // If not rescued → calculate diff between stranded and now
      const duration =
        row.status === "Rescued"
          ? this.timeDiff(strandedFormatted, rescuedFormatted)
          : !this.isDevMode()
            ? this.timeDiff(strandedFormatted)
            : this.timeDiff(
                strandedFormatted,
                this.formatDateTime(this.getDevTime()),
              );

      let durationRag = "";

      const lastContactFormatted = this.formatDateTime(row.lastContact);
      const lastContactDuration = !this.isDevMode()
        ? this.timeDiff(lastContactFormatted)
        : this.timeDiff(
            lastContactFormatted,
            this.formatDateTime(this.getDevTime()),
          );
      const lastContactMinutes = this.durationToMinutes(lastContactDuration);

      const lastContactRag =
        row.status === "Rescued"
          ? ""
          : lastContactMinutes >= 30
            ? "flashing-red"
            : lastContactMinutes >= 20
              ? "flashing-amber"
              : "";

      const durationMinutes = this.durationToMinutes(duration);
      if (durationMinutes >= 60) {
        durationRag = "td--red-bold";
      } else if (durationMinutes >= 30) {
        durationRag = "td--yellow-bold";
      }

      let loadingRag = "";

      switch (row.passengerLoading) {
        case "Very High":
          loadingRag = "td--red-bold";
          break;
        case "High":
          loadingRag = "td--red-bold";
          break;
        case "Medium":
          loadingRag = "td--yellow-bold";
          break;
        default:
          loadingRag = "";
      }

      let vulnerableRag = "";

      switch (row.vulnerablePeople) {
        case "1":
          vulnerableRag = "td--yellow-bold";
          break;
        case "2":
          vulnerableRag = "td--red-bold";
          break;
        case "3+":
          vulnerableRag = "td--red-bold";
          break;
        default:
          vulnerableRag = "";
      }

      markup += `
        <tr class="table-row" data-database-id="${row.id}">
         
          <td>${row.headcode}</td>
          <td>${row.location}</td>
          <td>${strandedFormatted}</td>
          <td class="${durationRag}">${duration}</td>
          <td class="${lastContactRag}">${row.contact}</td>

          <td class="${
            row.status === "Stranded" || row.status === "Trapped"
              ? "td--red-bold"
              : ""
          }">${row.status}</td>

          <td class="${loadingRag}">${row.passengerLoading}</td>

          <td class="${
            row.toiletsWorking === "No" ? "td--red-bold" : ""
          }">${row.toiletsWorking}</td>

          <td class="${vulnerableRag}">${row.vulnerablePeople}</td>

          <td>${row.tolo}</td>
          <td>${row.strandedTrainChampion}</td>
          <td>${row.planA ? `<b>Plan A</b><br>${row.planA.trim()}<br>` : ""}
              ${row.planB ? `<b>Plan B</b><br>${row.planB.trim()}<br>` : ""}
              ${row.planC ? `<b>Plan C</b><br>${row.planC.trim()}` : ""}</td>
          </td>

          <td>
            <button
              class="btn-delete ${row.showDeletionFlag ? "" : "hidden"}"
              data-index="${row.id}"
              aria-label="Delete row"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                   viewBox="0 0 24 24"
                   width="22"
                   height="22"
                   class="icon-trash-outline"
                   aria-hidden="true">
                <path
                  d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </td>
        </tr>`;
    }

    // Inject generated markup into DOM
    tableBody.innerHTML = markup;
  }

  isDevMode() {
    return !document
      .getElementById("date-time--dev")
      .classList.contains("hidden");
  }

  getDevTime() {
    return document.getElementById("date-time--dev").value;
  }

  /**
   * Convert a duration string (e.g. "3h 25m") into total minutes.
   *
   * @param {string} input - Duration string in format "Xh Ym"
   * @returns {number} Total minutes (0 if invalid)
   */
  durationToMinutes(input) {
    if (!input) return 0;

    const match = input.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    return hours * 60 + minutes;
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

  /**
   * Calculate time difference between two formatted date strings.
   *
   * If only input1 is provided, difference is calculated
   * between input1 and the current time.
   *
   * Output format:
   *   "Xh Ym"
   *
   * @param {string} input1 Formatted date string
   * @param {string|null} [input2=null] Optional end date
   * @returns {string} Duration string or empty string if invalid
   */
  timeDiff(input1, input2 = null) {
    if (!input1) return "";

    /**
     * Parses a formatted date string ("dd MMM yyyy HH:mm")
     * into a JavaScript Date object.
     *
     * @param {string} input
     * @returns {Date|null}
     */
    const parseDate = (input) => {
      if (!input) return null;

      const parts = input.trim().split(/\s+/);
      if (parts.length !== 4) return null;

      const [day, month, year, time] = parts;
      const [hours, minutes] = time.split(":").map(Number);

      if (isNaN(hours) || isNaN(minutes)) return null;

      // Month numeric (dd mm yyyy)
      if (!isNaN(month)) {
        return new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          hours,
          minutes,
        );
      }

      // Month string (dd mmm yyyy)
      return new Date(`${day} ${month} ${year} ${hours}:${minutes}`);
    };

    const startDate = parseDate(input1);
    const endDate = input2 ? parseDate(input2) : new Date();

    if (!startDate || !endDate) return "";

    let diffMs = endDate - startDate;
    const isNegative = diffMs < 0;
    diffMs = Math.abs(diffMs);

    const totalMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(totalMinutes / 60);
    const diffMinutes = totalMinutes % 60;

    return `${isNegative ? "- " : ""}${diffHours}h ${diffMinutes}m`;
  }
}

export default new Table();
