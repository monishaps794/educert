// status.js

// Same-origin backend
const API_BASE = "";

const statusForm = document.getElementById("status-form");
const applicationIdInput = document.getElementById("application-id");
const statusMessage = document.getElementById("status-message");
const statusResult = document.getElementById("status-result");
const statusDetails = document.getElementById("status-details");

// If status.html is opened with ?appId=123, pre-fill and auto-search
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const appId = params.get("appId");
  if (appId) {
    applicationIdInput.value = appId;
    fetchStatus(appId);
  }
});

statusForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const appId = applicationIdInput.value.trim();

  statusMessage.textContent = "";
  statusMessage.className = "";
  statusResult.classList.add("hidden");
  statusDetails.innerHTML = "";

  if (!appId) {
    statusMessage.textContent = "Please enter your Application ID.";
    statusMessage.className = "error";
    return;
  }

  fetchStatus(appId);
});

async function fetchStatus(appId) {
  try {
    statusMessage.textContent = "Checking status...";
    statusMessage.className = "";
    statusResult.classList.add("hidden");
    statusDetails.innerHTML = "";

    const res = await fetch(`${API_BASE}/api/applications/${appId}/status`);
    const data = await res.json();

    if (!res.ok) {
      statusMessage.textContent = data.message || "Application not found.";
      statusMessage.className = "error";
      return;
    }

    statusMessage.textContent = "";
    statusMessage.className = "";

    const createdAt = data.createdAt
      ? new Date(data.createdAt).toLocaleString()
      : "-";

    statusDetails.innerHTML = `
      <table>
        <tr>
          <th>Application ID</th>
          <td>${data.id}</td>
        </tr>
        <tr>
          <th>Student Name</th>
          <td>${data.name || "-"}</td>
        </tr>
        <tr>
          <th>USN</th>
          <td>${data.usn}</td>
        </tr>
        <tr>
          <th>Certificate Type</th>
          <td>${data.certificateType}</td>
        </tr>
        <tr>
          <th>Copy Type</th>
          <td>${data.copyType}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>${data.email || "-"}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td>
            <span class="badge ${data.status === "COMPLETED" ? "completed" : "pending"}">
              ${data.status}
            </span>
          </td>
        </tr>
        <tr>
          <th>Payment Status</th>
          <td>${data.paymentStatus}</td>
        </tr>
        <tr>
          <th>Applied On</th>
          <td>${createdAt}</td>
        </tr>
        <tr>
          <th>Uploaded Document</th>
          <td>
            ${
              data.documentPath
                ? `<a href="/uploads/${data.documentPath}" target="_blank">Download</a>`
                : "Not uploaded yet"
            }
          </td>
        </tr>
      </table>
    `;

    statusResult.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    statusMessage.textContent = "Something went wrong. Please try again.";
    statusMessage.className = "error";
    statusResult.classList.add("hidden");
  }
}
