var Api = (function () {
  async function request(url, options) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    } catch (err) {
      console.error("API error:", err);
      throw err;
    }
  }

  function jsonHeaders() {
    return { "Content-Type": "application/json" };
  }

  return {
    getProperties: function () {
      return request("/api/properties");
    },

    createProperty: function (data) {
      return request("/api/properties", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(data),
      });
    },

    updateProperty: function (id, data) {
      return request("/api/properties/" + id, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(data),
      });
    },

    deleteProperty: function (id) {
      return request("/api/properties/" + id, {
        method: "DELETE",
      });
    },

    addFollowUp: function (propertyId, data) {
      return request("/api/properties/" + propertyId + "/followups", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(data),
      });
    },

    deleteFollowUp: function (id) {
      return request("/api/followups/" + id, {
        method: "DELETE",
      });
    },
  };
})();
