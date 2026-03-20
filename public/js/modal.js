var Modal = (function () {
  function todayStr() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function init() {
    var btnAdd = document.getElementById("btn-add-property");
    if (btnAdd) btnAdd.addEventListener("click", function () { open(); });

    var btnCancel = document.getElementById("btn-cancel-modal");
    if (btnCancel) btnCancel.addEventListener("click", function () { close(); });

    var backdrop = document.querySelector("#property-modal .modal-backdrop");
    if (backdrop) backdrop.addEventListener("click", function () { close(); });

    var form = document.getElementById("property-form");
    if (form) form.addEventListener("submit", save);
  }

  async function open(editId) {
    var form = document.getElementById("property-form");
    var title = document.getElementById("modal-title");
    var modal = document.getElementById("property-modal");

    // Reset form
    form.reset();
    document.getElementById("form-id").value = "";

    if (editId) {
      title.textContent = "Edit Property";
      try {
        var properties = await Api.getProperties();
        var prop = null;
        for (var i = 0; i < properties.length; i++) {
          if (properties[i].id === editId || properties[i].id === Number(editId)) {
            prop = properties[i];
            break;
          }
        }
        if (prop) {
          document.getElementById("form-id").value = prop.id;
          document.getElementById("form-address").value = prop.address || "";
          document.getElementById("form-email").value = prop.email || "dana.gcy.invest@gmail.com";
          document.getElementById("form-agent-name").value = prop.agent_name || "";
          document.getElementById("form-agent-email").value = prop.agent_email || "";
          document.getElementById("form-agent-phone").value = prop.agent_phone || "";
          document.getElementById("form-listing-price").value = prop.listing_price || "";
          document.getElementById("form-initial-offer").value = prop.initial_offer || "";
          document.getElementById("form-offer-date").value = prop.offer_date || "";
          document.getElementById("form-seller-response").value = prop.seller_response || "";
        }
      } catch (err) {
        console.error("Failed to load property for editing:", err);
      }
    } else {
      title.textContent = "Add Property";
      document.getElementById("form-email").value = "dana.gcy.invest@gmail.com";
      document.getElementById("form-offer-date").value = todayStr();
    }

    modal.classList.remove("hidden");
  }

  function close() {
    var modal = document.getElementById("property-modal");
    modal.classList.add("hidden");
  }

  async function save(e) {
    e.preventDefault();

    var id = document.getElementById("form-id").value;
    var data = {
      address: document.getElementById("form-address").value,
      email: document.getElementById("form-email").value,
      agentName: document.getElementById("form-agent-name").value,
      agentEmail: document.getElementById("form-agent-email").value,
      agentPhone: document.getElementById("form-agent-phone").value,
      listingPrice: Number(document.getElementById("form-listing-price").value) || 0,
      initialOffer: Number(document.getElementById("form-initial-offer").value) || 0,
      offerDate: document.getElementById("form-offer-date").value,
      sellerResponse: document.getElementById("form-seller-response").value,
    };

    try {
      if (id) {
        await Api.updateProperty(id, data);
      } else {
        await Api.createProperty(data);
      }
      close();
      await Table.render();
    } catch (err) {
      alert("Failed to save property: " + err.message);
    }
  }

  return { init: init, open: open, close: close };
})();
