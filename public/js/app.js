document.addEventListener("DOMContentLoaded", function () {
  Table.render();
  if (typeof Modal !== "undefined" && Modal.init) Modal.init();
  if (typeof FollowUp !== "undefined" && FollowUp.init) FollowUp.init();
});
