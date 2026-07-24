import myAlert from "../js/alert.js";

const copyToClipboard = async (data) => {
  const html = getDataForCopyToTyrell(data);

  try {
    if (
      navigator.clipboard &&
      navigator.clipboard.write &&
      window.ClipboardItem
    ) {
      const htmlBlob = new Blob([html], { type: "text/html" });

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const plainText = tempDiv.innerText
        .replace(/\n\s*\n\s*\n+/g, "\n\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

      const textBlob = new Blob([plainText], {
        type: "text/plain",
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
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

const getDataForCopyToTyrell = (data) => {
  // console.log("Generating data for copy to Tyrell with input:", data);
  return `<b>${data.headcode}</b> is <b>${data.status}</b> at <b>${data.location}</b> ${data.locationW3W ? `(W3W - ${data.locationW3W})` : ""}<br><br>
<b>Train Info:</b><br>
${data.strandedAt ? `Stranded At - ${new Date(data.strandedAt).toLocaleString()}<br>` : ""}
${data.traction ? `Traction - ${data.traction}<br>` : ""}
<br>
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
${data.additionalInformation ? `<b>Additional Information:</b><br>${data.additionalInformation.replace(/\r?\n/g, "<br>")}<br><br>` : ""}`;
};

const tyrellClipboardService = {
  copyToClipboard,
};

export default tyrellClipboardService;
