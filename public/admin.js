document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "";

  const adminLoginSection = document.getElementById("admin-login-section");
  const adminLoginForm = document.getElementById("admin-login-form");
  const adminUsernameInput = document.getElementById("admin-username");
  const adminPasswordInput = document.getElementById("admin-password");

  const adminDashboard = document.getElementById("admin-dashboard");
  const adminMessage = document.getElementById("admin-message");
  const applicationsTableBody = document.querySelector("#applications-table tbody");

  const refreshBtn = document.getElementById("refresh-btn");
  const filterSelect = document.getElementById("status-filter");
  const downloadBtn = document.getElementById("download-btn");

  let allApplications = [];

  /* ================= ADMIN LOGIN ================= */
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUsernameInput.value.trim(),
        password: adminPasswordInput.value.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    adminLoginSection.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    loadApplications();
  });

  refreshBtn.addEventListener("click", loadApplications);
  filterSelect.addEventListener("change", renderTable);
  downloadBtn.addEventListener("click", downloadCSV);

  /* ================= LOAD APPLICATIONS ================= */
  async function loadApplications() {
    adminMessage.textContent = "Loading applications...";
    const res = await fetch(`${API_BASE}/api/admin/applications`);
    allApplications = await res.json();
    renderTable();
  }

  /* ================= FILTER + RENDER ================= */
  function renderTable() {
    applicationsTableBody.innerHTML = "";
    const filter = filterSelect.value;

    const filtered =
      filter === "ALL"
        ? allApplications
        : allApplications.filter((a) => a.status === filter);

    adminMessage.textContent = `Showing ${filtered.length} applications`;

    filtered.forEach((app) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${app.id}</td>
        <td>${app.usn}</td>
        <td>${app.certificateType}</td>
        <td>${app.copyType}</td>
        <td>${app.copies ?? 1}</td>
        <td>${app.email}</td>
        <td>${app.address ?? "-"}</td>
        <td>
          ${
            app.certificateType === "Other"
              ? `<strong>${app.otherReason ?? "-"}</strong><br><small>${app.otherDescription ?? ""}</small>`
              : "-"
          }
        </td>
        <td><strong>${app.status}</strong></td>
        <td>${app.paymentStatus}</td>
        <td>
          ${
            app.documentPath
              ? `<a href="/uploads/${app.documentPath}" target="_blank">View</a>`
              : "-"
          }
        </td>
        <td>
          ${
            app.status === "PENDING"
              ? `
              <form class="complete-form" data-id="${app.id}">
                ${
                  app.copyType === "Hardcopy"
                    ? `
                      <input type="hidden" name="copyType" value="Hardcopy" />
                      <button type="submit">Mark as Posted</button>
                    `
                    : app.copyType === "Softcopy"
                    ? `
                      <input type="file" name="document" required />
                      <input type="hidden" name="copyType" value="Softcopy" />
                      <button type="submit">Upload & Send</button>
                    `
                    : `
                      <input type="file" name="document" />
                      <input type="hidden" name="copyType" value="Both" />
                      <button type="submit">Upload & Send</button>
                      <button type="button" class="mark-posted-btn" data-id="${app.id}">
                        Mark as Posted
                      </button>
                    `
                }
              </form>

              <form class="reject-form" data-id="${app.id}">
                <textarea name="reason" placeholder="Reason for rejection" required></textarea>
                <button type="submit" style="background:#c62828;color:white;">Reject</button>
              </form>
            `
              : "-"
          }
        </td>
      `;

      applicationsTableBody.appendChild(tr);
    });

    attachActionHandlers();
  }

  /* ================= ACTION HANDLERS ================= */
  function attachActionHandlers() {
    document.querySelectorAll(".complete-form").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const appId = form.dataset.id;
        const copyType = form.querySelector("input[name='copyType']").value;
        const fileInput = form.querySelector("input[type='file']");

        const fd = new FormData();
        fd.append("copyType", copyType);
        if (fileInput?.files?.length) fd.append("document", fileInput.files[0]);

        const res = await fetch(`${API_BASE}/api/admin/applications/${appId}/complete`, {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok) return alert(data.message);
        loadApplications();
      });
    });

    document.querySelectorAll(".mark-posted-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const fd = new FormData();
        fd.append("copyType", "Hardcopy");

        const res = await fetch(
          `${API_BASE}/api/admin/applications/${btn.dataset.id}/complete`,
          { method: "POST", body: fd }
        );

        const data = await res.json();
        if (!res.ok) return alert(data.message);
        loadApplications();
      });
    });

    document.querySelectorAll(".reject-form").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const reason = form.querySelector("textarea").value.trim();
        if (!reason) return alert("Enter rejection reason");

        const res = await fetch(
          `${API_BASE}/api/admin/applications/${form.dataset.id}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        );

        const data = await res.json();
        if (!res.ok) return alert(data.message);
        loadApplications();
      });
    });
  }

  /* ================= DOWNLOAD CSV ================= */
  function downloadCSV() {
    let csv = "ID,USN,Certificate,CopyType,Copies,Email,Status,Payment\n";
    allApplications.forEach((a) => {
      csv += `${a.id},${a.usn},${a.certificateType},${a.copyType},${a.copies},${a.email},${a.status},${a.paymentStatus}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
});
