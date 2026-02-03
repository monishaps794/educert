// student.js
const API_BASE = "";

const loginSection = document.getElementById("login-section");
const applicationSection = document.getElementById("application-section");
const welcomeText = document.getElementById("welcome-text");

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

const certificateSelect = document.getElementById("certificate-type");
const applicationForm = document.getElementById("application-form");
const applicationMessage = document.getElementById("application-message");

// ================= PAGE LOAD FLOW CONTROL =================
const usn = localStorage.getItem("usn");
const name = localStorage.getItem("name");
const detailsCompleted = localStorage.getItem("detailsCompleted");
const fromDetails = sessionStorage.getItem("fromDetails");

// ✅ Details completed → show application page
if (usn && name && detailsCompleted === "true" && fromDetails === "true") {
  sessionStorage.removeItem("fromDetails"); // important
  loginSection.classList.add("hidden");
  applicationSection.classList.remove("hidden");
  welcomeText.textContent = `Welcome, ${name} (USN: ${usn})`;
  loadCertificates();
} 
// ❌ Otherwise → show login page
else {
  loginSection.classList.remove("hidden");
  applicationSection.classList.add("hidden");
}

// ================= HANDLE LOGIN =================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMessage.textContent = "";

  const nameInput = document.getElementById("name").value.trim();
  const usnInput = document.getElementById("usn").value.trim();
  const dob = document.getElementById("dob").value;

  if (!nameInput || !usnInput || !dob) {
    loginMessage.textContent = "Please fill all fields.";
    loginMessage.className = "error";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/student-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usn: usnInput, dob }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginMessage.textContent = data.message || "Login failed.";
      loginMessage.className = "error";
      return;
    }

    // ✅ Save login info
    localStorage.setItem("usn", usnInput);
    localStorage.setItem("name", nameInput);

    // ❗ Force details page next
    localStorage.removeItem("detailsCompleted");

    window.location.href = "student-details.html";
  } catch (err) {
    console.error(err);
    loginMessage.textContent = "Something went wrong.";
    loginMessage.className = "error";
  }
});

// ================= LOAD CERTIFICATES =================
async function loadCertificates() {
  certificateSelect.innerHTML = `<option value="">Select a certificate</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/certificates`);
    const certs = await res.json();
    certs.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      certificateSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

// ================= APPLY FOR CERTIFICATE =================
applicationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  applicationMessage.textContent = "";

  const certificateType = certificateSelect.value;
  const copyType = document.getElementById("copy-type").value;
  const email = document.getElementById("student-email").value.trim();

  if (!certificateType || !copyType) {
    applicationMessage.textContent = "Please select all fields.";
    applicationMessage.className = "error";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usn,
        certificateType,
        copyType,
        email: email || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      applicationMessage.textContent = data.message || "Failed to apply.";
      applicationMessage.className = "error";
      return;
    }

    applicationMessage.innerHTML = `
      <p class="success">
        Application submitted successfully!<br/>
        <strong>Application ID:</strong> ${data.id}
      </p>
    `;
  } catch (err) {
    console.error(err);
    applicationMessage.textContent = "Something went wrong.";
    applicationMessage.className = "error";
  }
});
