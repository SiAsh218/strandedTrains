class PrintHandler {
  constructor() {
    this.activatePrint = null;
  }

  deactivatePrintDivs() {
    const printDivs = document.querySelectorAll(".div-print");
    printDivs.forEach((div) => div.classList.remove("div-print--active"));
    this.activatePrint = null;
  }

  activatePrintDiv(div) {
    div.classList.add("div-print--active");
    this.activatePrint = div;
  }

  printStrandedTrain(data) {
    const markup = `
      <div class="print-form">
        <h1>Stranded Passengers Risk Assessment</h1>
        <div class="section" >
          <h2>General Information</h2>
          <div class="row inline-group">
            <div class="label">Headcode</div>
            <div class="value">${data.headcode}</div>
            <div class="label">Stood At</div>
            <div class="value">${new Date(data.strandedAt).toLocaleString()}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Traction</div>
            <div class="value">${data.traction}</div>
            <div class="label">CCIL</div>
            <div class="value">${data.ccilRef}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Location</div>
            <div class="value">${data.location}</div>
            <div class="label">W3W</div>
            <div class="value">${data.locationW3W}</div>
          </div>
        </div>
        <div class="section" >
          <h2>Passenger Considerations</h2>
          <div class="row inline-group">
            <div class="label">Passenger Loading</div>
            <div class="value">${data.passengerLoading}</div>
            <div class="label">Passenger Count</div>
            <div class="value">${data.passengerCount}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Vulnerable People</div>
            <div class="value">${data.vulnerablePeople}</div>
            <div class="label">Staff Onboard</div>
            <div class="value">${data.noOfStaff}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Toilets Working</div>
            <div class="value">${data.toiletsWorking}</div>
            <div class="label">PA Working</div>
            <div class="value">${data.paWorking}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Lighting</div>
            <div class="value">${data.lighting}</div>
            <div class="label">Mood Onboard</div>
            <div class="value">${data.moodOnboard}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Heating</div>
            <div class="value">${data.heatingRequired}</div>
            <div class="label">Air Cooling</div>
            <div class="value">${data.airCoolingRequired}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Catering Available</div>
            <div class="value">${data.cateringAvailable}</div>
            <div class="label"></div>
            <div class="value" style="border-bottom: none"></div>
          </div>
        </div>
        <div class="section" >
          <h2>Plan</h2>
          <div class="row inline-group">
            <div class="label">Plan A</div>
            <div class="value">${data.planA}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Plan B</div>
            <div class="value">${data.planB}</div>
          </div>
          <div class="row inline-group">
            <div class="label">Plan C</div>
            <div class="value">${data.planC}</div>
          </div>
        </div>
        <div class="section" >
          <h2>Additional Information</h2>
          <div class="row inline-group">
            <div class="label">Other Affected Trains</div>
            <div class="value">${data.otherAffectedTrains}</div>
            <div class="label">Additional Information</div>
            <div class="value">${data.additionalInformation}</div>
          </div>
        </div>
      </div>
    `;

    this.activatePrint.innerHTML = markup;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.print();
      });
    });
  }

  print() {
    window.print();
  }
}

export default new PrintHandler();
