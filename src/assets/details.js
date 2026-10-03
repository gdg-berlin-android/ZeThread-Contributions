const dialog = document.getElementById("patch-details");
const contributor = document.getElementById("details-contributor");
const timestamp = document.getElementById("details-timestamp");
const profile = document.getElementById("details-profile");
const profileWrapper = document.getElementById("details-profile-wrapper");
const title = document.getElementById("details-title");
const metadata = document.getElementById("details-metadata");
const conflictPanel = document.getElementById("details-conflicts");
const conflictLinks = document.getElementById("details-conflict-links");
const conflictIcon = document.getElementById("details-conflict-icon");

function formatLocalTimestamp(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Unknown date";

  // Use the device timezone's offset at the contribution date, including DST.
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 19);
  const sign = offset > 0 ? "-" : "+";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  return `${local}${sign}${hours}:${minutes}`;
}

document.querySelector(".wall").addEventListener("click", (event) => {
  const patch = event.target.closest(".wall__button");
  if (!patch) return;

  const conflict = Boolean(patch.dataset.conflictTemplate);
  metadata.hidden = conflict;
  conflictPanel.hidden = !conflict;
  conflictIcon.hidden = !conflict;
  dialog.classList.toggle("details--conflict", conflict);
  conflictLinks.replaceChildren();
  if (conflict) {
    title.textContent = "This cell has conflicts that must be resolved";
    const template = document.getElementById(patch.dataset.conflictTemplate);
    conflictLinks.append(template.content.cloneNode(true));
  } else {
    title.textContent = "Patch details";
    contributor.textContent = patch.dataset.contributor;
    timestamp.textContent = formatLocalTimestamp(patch.dataset.timestamp);
    if (patch.dataset.timestamp) {
      timestamp.dateTime = patch.dataset.timestamp;
    } else {
      timestamp.removeAttribute("datetime");
    }
    profileWrapper.hidden = !patch.dataset.githubUrl;
    if (patch.dataset.githubUrl) {
      profile.textContent = `@${patch.dataset.githubHandle}`;
      profile.href = patch.dataset.githubUrl;
    } else {
      profile.textContent = "";
      profile.removeAttribute("href");
    }
  }
  patch.focus({ preventScroll: true });
  dialog.showModal();
});
