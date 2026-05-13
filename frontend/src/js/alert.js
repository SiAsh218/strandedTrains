/**
 * Alert utility class for rendering temporary alert banners
 * and custom confirm dialogs in the DOM.
 *
 * Usage:
 *   import Alert from "./Alert.js";
 *   Alert.render("Saved successfully", "success", 3);
 *   const confirmed = await Alert.showConfirm("Delete item?");
 */
class Alert {
  /**
   * Creates a new Alert instance.
   * `id` is used to generate unique DOM element IDs.
   */
  constructor() {
    /**
     * Incrementing identifier used to create unique element IDs.
     * @type {number}
     */
    this.id = 0;
  }

  /**
   * Render a custom alert banner at the top of the screen.
   *
   * Alert types:
   * - "error"   → red
   * - "success" → green
   * - "info"    → yellow
   *
   * @param {string} [message="Something has gone wrong"]
   * The message to display inside the alert banner.
   *
   * @param {"error"|"success"|"info"} [type="error"]
   * The visual style of the alert.
   *
   * @param {number} [time=3]
   * Duration (in seconds) before the alert automatically disappears.
   *
   * @returns {void}
   */
  render(message = "Something has gone wrong", type = "error", time = 3) {
    // Determine background colour based on type
    const fill = this.getAlertColour(type);

    // Build alert markup with unique ID
    this.markup = `
      <div class="alert"
           style="position: fixed; top: 0; z-index: 9999;
                  width: 100%; display: flex; justify-content: center;
                  background-color: ${fill};
                  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.5);"
           id="alert--${this.id}">
        <span style="padding: 5px; font-size: 18px; font-weight: bold;">
          ${message}
        </span>
      </div>`;

    const id = this.id;

    // Ensure only one alert is shown at a time
    this.removeAllAlerts();

    // Insert alert into DOM
    document.body.insertAdjacentHTML("afterbegin", this.markup);

    // Automatically remove alert after specified time
    setTimeout(() => {
      this.removeAlert(id);
    }, time * 1000);

    // Increment ID for next alert
    this.id++;
  }

  /**
   * Returns the hex colour associated with a given alert type.
   *
   * @param {"error"|"success"|"info"} type
   * @returns {string} Hex colour string
   */
  getAlertColour(type) {
    switch (type) {
      case "error":
        return "#f64f5f";
      case "success":
        return "#77DD77";
      case "info":
        return "#FDFD96";
      default:
        return "#f64f5f"; // fallback to error colour
    }
  }

  /**
   * Remove a specific alert from the DOM by ID.
   *
   * @param {number|string} id
   * The numeric ID used when rendering the alert.
   *
   * @returns {void}
   */
  removeAlert(id) {
    const element = document.getElementById(`alert--${id}`);
    if (element) element.remove();
  }

  /**
   * Remove all currently displayed alerts from the DOM.
   *
   * @returns {void}
   */
  removeAllAlerts() {
    document.querySelectorAll(".alert").forEach((alert) => alert.remove());
  }

  /**
   * Display a custom confirmation dialog.
   *
   * This method returns a Promise that resolves:
   * - `true`  → user clicked confirm
   * - `false` → user clicked cancel
   *
   * Example:
   *   const confirmed = await Alert.showConfirm("Delete item?");
   *   if (confirmed) deleteItem();
   *
   * @param {string} [message="Are you sure?"]
   * Message displayed inside the confirm dialog.
   *
   * @param {string} [confirmText="OK"]
   * Text shown on the confirm button.
   *
   * @param {string} [cancelText="Cancel"]
   * Text shown on the cancel button.
   *
   * @returns {Promise<boolean>}
   */
  async showConfirm(
    message = "Are you sure?",
    confirmText = "OK",
    cancelText = "Cancel",
  ) {
    const id = this.id++;

    // Overlay + modal markup
    const markup = `
      <div id="confirm-overlay--${id}"
           style="position: fixed; inset: 0;
                  background: rgba(0,0,0,0.4);
                  display: flex; justify-content: center;
                  align-items: center; z-index: 10000;">

        <div style="background: white; padding: 20px;
                    border-radius: 6px; min-width: 300px;
                    text-align: center;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);">

          <p style="margin-bottom: 20px;">${message}</p>

          <div style="display: flex; justify-content: space-around;">
            <button class="btn"
                    id="confirm-true--${id}"
                    style="padding:6px 12px;">
              ${confirmText}
            </button>

            <button class="btn"
                    id="confirm-false--${id}"
                    style="padding:6px 12px;">
              ${cancelText}
            </button>
          </div>
        </div>
      </div>
    `;

    // Insert modal into DOM
    document.body.insertAdjacentHTML("beforeend", markup);

    const overlay = document.getElementById(`confirm-overlay--${id}`);
    const confirmBtn = document.getElementById(`confirm-true--${id}`);
    const cancelBtn = document.getElementById(`confirm-false--${id}`);

    // Return a promise that resolves based on button clicked
    const result = await new Promise((resolve) => {
      const cleanup = (value) => {
        overlay.remove();
        resolve(value);
      };

      confirmBtn.addEventListener("click", () => cleanup(true));
      cancelBtn.addEventListener("click", () => cleanup(false));
    });

    return result;
  }
}

export default new Alert();
