var Table = (function () {
  function formatCurrency(val) {
    if (!val && val !== 0) return "";
    var num = Number(val);
    if (isNaN(num)) return "";
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    var yy = String(d.getFullYear()).slice(-2);
    return mm + "/" + dd + "/" + yy;
  }

  function statusClass(response) {
    if (!response) return "status-none";
    var lower = response.toLowerCase().trim();
    if (lower === "closed") return "status-closed";
    if (lower === "checking") return "status-checking";
    if (lower === "accepted") return "status-accepted";
    return "status-other";
  }

  function createTextTd(text, className) {
    var td = document.createElement("td");
    if (className) td.className = className;
    td.textContent = text;
    return td;
  }

  function buildHeaderRow() {
    var headers = ["", "Property Address", "Agent Name", "Contact Info", "Listing Price", "Initial Offer", "Offer Date", "Seller Response", "Follow-Ups", "Actions"];
    var tr = document.createElement("tr");
    for (var i = 0; i < headers.length; i++) {
      var th = document.createElement("th");
      th.textContent = headers[i];
      tr.appendChild(th);
    }
    return tr;
  }

  function buildPropertyRow(prop) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-id", prop.id);

    // Expand arrow
    var tdExpand = document.createElement("td");
    var btnExpand = document.createElement("button");
    btnExpand.className = "btn-expand";
    btnExpand.textContent = "\u25B6";
    btnExpand.setAttribute("data-id", prop.id);
    tdExpand.appendChild(btnExpand);
    tr.appendChild(tdExpand);

    // Address
    tr.appendChild(createTextTd(prop.address || "", "col-address"));

    // Agent Name
    tr.appendChild(createTextTd(prop.agent_name || ""));

    // Contact Info
    var tdContact = document.createElement("td");
    tdContact.className = "col-contact";
    if (prop.agent_email) {
      var emailSpan = document.createElement("div");
      emailSpan.textContent = prop.agent_email;
      tdContact.appendChild(emailSpan);
    }
    if (prop.agent_phone) {
      var phoneSpan = document.createElement("div");
      phoneSpan.textContent = prop.agent_phone;
      tdContact.appendChild(phoneSpan);
    }
    tr.appendChild(tdContact);

    // Listing Price
    tr.appendChild(createTextTd(formatCurrency(prop.listing_price)));

    // Initial Offer
    tr.appendChild(createTextTd(formatCurrency(prop.initial_offer)));

    // Offer Date
    tr.appendChild(createTextTd(formatDate(prop.offer_date)));

    // Seller Response badge (clickable for inline editing)
    var tdStatus = document.createElement("td");
    var badge = document.createElement("span");
    badge.className = "status-badge status-editable " + statusClass(prop.seller_response);
    badge.textContent = prop.seller_response || "none";
    badge.setAttribute("title", "Click to update");
    (function (badge, prop) {
      badge.addEventListener("click", function () {
        var currentValue = prop.seller_response || "";
        var input = document.createElement("input");
        input.type = "text";
        input.value = currentValue;
        input.className = "status-inline-input";
        input.placeholder = "e.g. checking, closed, accepted";
        badge.replaceWith(input);
        input.focus();
        input.select();

        var committed = false;
        function commitChange() {
          if (committed) return;
          committed = true;
          Api.updateProperty(prop.id, { sellerResponse: input.value.trim() }).then(function () {
            Table.render();
          });
        }

        input.addEventListener("blur", commitChange);
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            input.removeEventListener("blur", commitChange);
            commitChange();
          } else if (e.key === "Escape") {
            e.preventDefault();
            input.removeEventListener("blur", commitChange);
            Table.render();
          }
        });
      });
    })(badge, prop);
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);

    // Follow-Ups count
    var tdFu = document.createElement("td");
    var fuCount = (prop.followUps && prop.followUps.length) || 0;
    var fuBadge = document.createElement("span");
    fuBadge.className = "fu-count";
    fuBadge.textContent = fuCount;
    tdFu.appendChild(fuBadge);
    tr.appendChild(tdFu);

    // Actions
    var tdActions = document.createElement("td");
    var btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-sm btn-secondary";
    btnEdit.textContent = "Edit";
    btnEdit.setAttribute("data-id", prop.id);

    var btnDel = document.createElement("button");
    btnDel.className = "btn btn-sm btn-danger";
    btnDel.textContent = "Del";
    btnDel.setAttribute("data-id", prop.id);

    tdActions.appendChild(btnEdit);
    tdActions.appendChild(document.createTextNode(" "));
    tdActions.appendChild(btnDel);
    tr.appendChild(tdActions);

    return { tr: tr, btnExpand: btnExpand, btnEdit: btnEdit, btnDel: btnDel };
  }

  function buildFollowUpRow(prop) {
    var tr = document.createElement("tr");
    tr.className = "followup-row hidden";
    tr.id = "fu-row-" + prop.id;

    var td = document.createElement("td");
    td.setAttribute("colspan", "10");

    var panel = document.createElement("div");
    panel.className = "followup-panel";
    panel.setAttribute("data-property-id", prop.id);

    td.appendChild(panel);
    tr.appendChild(td);
    return tr;
  }

  async function render() {
    var container = document.getElementById("table-container");
    if (!container) return;

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var properties;
    try {
      properties = await Api.getProperties();
    } catch (err) {
      var errMsg = document.createElement("p");
      errMsg.className = "empty-state";
      errMsg.textContent = "Error loading properties.";
      container.appendChild(errMsg);
      return;
    }

    if (!properties || properties.length === 0) {
      var emptyMsg = document.createElement("p");
      emptyMsg.className = "empty-state";
      emptyMsg.textContent = "No properties yet. Click \"+ Add Property\" to get started.";
      container.appendChild(emptyMsg);
      return;
    }

    var table = document.createElement("table");
    table.className = "prop-table";

    var thead = document.createElement("thead");
    thead.appendChild(buildHeaderRow());
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    for (var i = 0; i < properties.length; i++) {
      var prop = properties[i];
      var row = buildPropertyRow(prop);
      var fuRow = buildFollowUpRow(prop);

      // Wire expand button
      (function (btnExpand, fuRow, propId) {
        btnExpand.addEventListener("click", function () {
          var isHidden = fuRow.classList.contains("hidden");
          fuRow.classList.toggle("hidden");
          btnExpand.textContent = isHidden ? "\u25BC" : "\u25B6";
          if (isHidden && typeof FollowUp !== "undefined" && FollowUp.renderPanel) {
            FollowUp.renderPanel(propId);
          }
        });
      })(row.btnExpand, fuRow, prop.id);

      // Wire edit button
      (function (btnEdit, propId) {
        btnEdit.addEventListener("click", function () {
          if (typeof Modal !== "undefined" && Modal.open) {
            Modal.open(propId);
          }
        });
      })(row.btnEdit, prop.id);

      // Wire delete button
      (function (btnDel, propId) {
        btnDel.addEventListener("click", async function () {
          if (!confirm("Delete this property?")) return;
          try {
            await Api.deleteProperty(propId);
            await Table.render();
          } catch (err) {
            alert("Failed to delete property.");
          }
        });
      })(row.btnDel, prop.id);

      tbody.appendChild(row.tr);
      tbody.appendChild(fuRow);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  return {
    render: render,
  };
})();
