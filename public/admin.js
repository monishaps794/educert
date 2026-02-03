// admin.js

// Same-origin:
const API_BASE = "";

const adminLoginSection = document.getElementById("admin-login-section");
const adminLoginForm = document.getElementById("admin-login-form");
const adminUsernameInput = document.getElementById("admin-username");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginMessage = document.getElementById("admin-login-message");

const adminDashboard = document.getElementById("admin-dashboard");
const adminMessage = document.getElementById("admin-message");
const applicationsTableBody = document.querySelector("#applications-table tbody");
const refreshBtn = document.getElementById("refresh-btn");

let isAdminLoggedIn = false;

// ================= ADMIN LOGIN =================
adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminLoginMessage.textContent = "";
  adminLoginMessage.className = "";

  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value.trim();

  if (!username || !password) {
    adminLoginMessage.textContent = "Please enter username and password.";
    adminLoginMessage.className = "error";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      adminLoginMessage.textContent = data.message || "Login failed.";
      adminLoginMessage.className = "error";
      return;
    }

    isAdminLoggedIn = true;
    adminLoginSection.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    adminMessage.textContent = `Logged in as ${data.username}`;
    loadApplications();
  } catch (err) {
    console.error(err);
    adminLoginMessage.textContent = "Something went wrong.";
    adminLoginMessage.className = "error";
  }
});

refreshBtn.addEventListener("click", () => {
  if (isAdminLoggedIn) loadApplications();
});

// ================= LOAD APPLICATIONS =================
async function loadApplications() {
  adminMessage.textContent = "Loading applications...";
  applicationsTableBody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/admin/applications`);
    const apps = await res.json();

    adminMessage.textContent = `Total applications: ${apps.length}`;

    apps.forEach((app) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${app.id}</td>
        <td>${app.usn}</td>
        <td>${app.certificateType}</td>
        <td>${app.copyType}</td>
        <td>${app.email ?? ""}</td>
        <td>${app.address ?? "—"}</td>
        <td>
          <span class="badge ${app.status === "COMPLETED" ? "completed" : "pending"}">
            ${app.status}
          </span>
        </td>
        <td>${app.paymentStatus}</td>
        <td>
          ${
            app.documentPath
              ? `<a href="/uploads/${app.documentPath}" target="_blank">View</a>`
              : "-"
          }
        </td>
        <td>
          <form class="complete-form" data-id="${app.id}">
            <input type="email" name="email" placeholder="Email" required />

            ${
              app.copyType === "Hardcopy"
                ? `
                  <input type="hidden" name="copyType" value="Hardcopy" />
                  <button type="submit">Mark as Posted</button>
                `
                : `
                  <input type="file" name="document" required />
                  <input type="hidden" name="copyType" value="${app.copyType}" />
                  <button type="submit">Upload & Send</button>
                `
            }
          </form>
        </td>
      `;

      applicationsTableBody.appendChild(tr);
    });

    document.querySelectorAll(".complete-form").forEach((form) => {
      form.addEventListener("submit", handleCompleteFormSubmit);
    });
  } catch (err) {
    console.error(err);
    adminMessage.textContent = "Failed to load applications.";
    adminMessage.className = "error";
  }
}

// ================= COMPLETE APPLICATION =================
async function handleCompleteFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const appId = form.getAttribute("data-id");
  const emailInput = form.querySelector('input[name="email"]');
  const copyType = form.querySelector('input[name="copyType"]').value;
  const fileInput = form.querySelector('input[name="document"]');

  if (!emailInput.value) {
    alert("Email is required.");
    return;
  }

  if (copyType !== "Hardcopy" && (!fileInput || !fileInput.files.length)) {
    alert("Please upload the document.");
    return;
  }

  const formData = new FormData();
  formData.append("email", emailInput.value);
  formData.append("copyType", copyType);

  if (fileInput && fileInput.files.length) {
    formData.append("document", fileInput.files[0]);
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/admin/applications/${appId}/complete`,
      { method: "POST", body: formData }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to complete application.");
      return;
    }

    alert(
      copyType === "Hardcopy"
        ? "Hardcopy marked as posted and confirmation email sent."
        : "Document uploaded and emailed successfully."
    );

    loadApplications();
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
}
