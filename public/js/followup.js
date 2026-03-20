var FollowUp = (function () {
  function formatDate(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function todayISO() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mm + "-" + dd;
  }

  function reExpandRow(propertyId) {
    var fuRow = document.getElementById("fu-row-" + propertyId);
    if (fuRow) {
      fuRow.classList.remove("hidden");
      // Update expand button arrow
      var btn = document.querySelector('.btn-expand[data-id="' + propertyId + '"]');
      if (btn) btn.textContent = "\u25BC";
    }
  }

  function init() {
    // Nothing global needed — events are wired per panel render
  }

  async function renderPanel(propertyId) {
    var panel = document.querySelector('.followup-panel[data-property-id="' + propertyId + '"]');
    if (!panel) return;

    // Fetch property data
    var properties;
    try {
      properties = await Api.getProperties();
    } catch (err) {
      return;
    }

    var property = null;
    for (var i = 0; i < properties.length; i++) {
      if (properties[i].id === propertyId || String(properties[i].id) === String(propertyId)) {
        property = properties[i];
        break;
      }
    }
    if (!property) return;

    // Clear panel
    while (panel.firstChild) {
      panel.removeChild(panel.firstChild);
    }

    // Build wrapper
    var wrapper = document.createElement("div");
    wrapper.className = "fu-panel-inner";

    // Title
    var h3 = document.createElement("h3");
    h3.textContent = "Follow-Up History for: " + (property.address || "");
    wrapper.appendChild(h3);

    var followUps = property.followUps || [];

    if (followUps.length === 0) {
      var emptyP = document.createElement("p");
      emptyP.className = "fu-empty";
      emptyP.textContent = "No follow-ups yet.";
      wrapper.appendChild(emptyP);
    } else {
      var timeline = document.createElement("div");
      timeline.className = "fu-timeline";

      for (var i = 0; i < followUps.length; i++) {
        var fu = followUps[i];

        var entry = document.createElement("div");
        entry.className = "fu-entry";

        // Header
        var header = document.createElement("div");
        header.className = "fu-entry-header";

        var methodSpan = document.createElement("span");
        methodSpan.className = "fu-method fu-method-" + (fu.method || "email");
        methodSpan.textContent = (fu.method || "email").toUpperCase();
        header.appendChild(methodSpan);

        var dateSpan = document.createElement("span");
        dateSpan.className = "fu-date";
        dateSpan.textContent = formatDate(fu.date);
        header.appendChild(dateSpan);

        var delBtn = document.createElement("button");
        delBtn.className = "btn btn-sm btn-danger fu-delete";
        delBtn.textContent = "x";
        delBtn.setAttribute("data-property-id", propertyId);
        delBtn.setAttribute("data-fu-id", fu.id);
        header.appendChild(delBtn);

        entry.appendChild(header);

        var notesP = document.createElement("p");
        notesP.className = "fu-notes";
        notesP.textContent = fu.notes || "";
        entry.appendChild(notesP);

        timeline.appendChild(entry);
      }

      wrapper.appendChild(timeline);
    }

    // Add Follow-Up form
    var form = document.createElement("form");
    form.className = "fu-add-form";

    var h4 = document.createElement("h4");
    h4.textContent = "Add Follow-Up";
    form.appendChild(h4);

    var formRow = document.createElement("div");
    formRow.className = "fu-form-row";

    // Date label + input
    var dateLabel = document.createElement("label");
    dateLabel.textContent = "Date";
    var dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = todayISO();
    dateInput.required = true;
    dateLabel.appendChild(dateInput);
    formRow.appendChild(dateLabel);

    // Method label + select
    var methodLabel = document.createElement("label");
    methodLabel.textContent = "Method";
    var methodSelect = document.createElement("select");
    var methods = [
      { value: "email", text: "Email" },
      { value: "text", text: "Text" },
      { value: "phone", text: "Phone" },
      { value: "in-person", text: "In-Person" }
    ];
    for (var m = 0; m < methods.length; m++) {
      var opt = document.createElement("option");
      opt.value = methods[m].value;
      opt.textContent = methods[m].text;
      methodSelect.appendChild(opt);
    }
    methodLabel.appendChild(methodSelect);
    formRow.appendChild(methodLabel);

    form.appendChild(formRow);

    // Notes textarea
    var notesTextarea = document.createElement("textarea");
    notesTextarea.className = "fu-input-notes";
    notesTextarea.rows = 2;
    notesTextarea.placeholder = "What happened? What was the response?";
    notesTextarea.required = true;
    form.appendChild(notesTextarea);

    // Submit button
    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "btn btn-primary btn-sm";
    submitBtn.textContent = "Add Follow-Up";
    form.appendChild(submitBtn);

    wrapper.appendChild(form);
    panel.appendChild(wrapper);

    // Wire form submit
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var date = dateInput.value;
      var method = methodSelect.value;
      var notes = notesTextarea.value;
      try {
        await Api.addFollowUp(propertyId, { date: date, method: method, notes: notes });
        await Table.render();
        reExpandRow(propertyId);
        await renderPanel(propertyId);
      } catch (err) {
        alert("Failed to add follow-up.");
      }
    });

    // Wire delete buttons
    var deleteButtons = wrapper.querySelectorAll(".fu-delete");
    for (var d = 0; d < deleteButtons.length; d++) {
      (function (btn) {
        btn.addEventListener("click", async function () {
          var fuId = btn.getAttribute("data-fu-id");
          try {
            await Api.deleteFollowUp(fuId);
            await Table.render();
            reExpandRow(propertyId);
            await renderPanel(propertyId);
          } catch (err) {
            alert("Failed to delete follow-up.");
          }
        });
      })(deleteButtons[d]);
    }
  }

  return {
    init: init,
    renderPanel: renderPanel
  };
})();
