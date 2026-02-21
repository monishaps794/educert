const API_BASE = "";

const loginSection = document.getElementById("login-section");
const applicationSection = document.getElementById("application-section");
const welcomeText = document.getElementById("welcome-text");

const certificateSelect = document.getElementById("certificate-type");
const otherFields = document.getElementById("other-fields");

const emailInput = document.getElementById("login-email");
const otpBox = document.getElementById("otp-box");
const otpInput = document.getElementById("otp");
const sendOtpBtn = document.getElementById("send-otp-btn");
const loginMessage = document.getElementById("login-message");

/* ======================================================
   ✅ OPEN CERTIFICATE PAGE ONLY AFTER DETAILS PAGE
====================================================== */
const email = localStorage.getItem("email");
const otpVerified = localStorage.getItem("otpVerified");
const detailsCompleted = localStorage.getItem("detailsCompleted");
const fromDetails = sessionStorage.getItem("fromDetails");

if (
  email &&
  otpVerified === "true" &&
  detailsCompleted === "true" &&
  fromDetails === "true"
) {
  sessionStorage.removeItem("fromDetails"); // 🔥 critical
  loginSection.classList.add("hidden");
  applicationSection.classList.remove("hidden");
  welcomeText.textContent = `Welcome, ${email}`;
  loadCertificates();
}

/* ================= OTP SEND ================= */
sendOtpBtn.addEventListener("click", async () => {
  const emailVal = emailInput.value.trim();
  if (!emailVal) return alert("Enter email");

  const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailVal }),
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  otpBox.classList.remove("hidden");
  loginMessage.textContent = "OTP sent to your email";
});

/* ================= OTP VERIFY ================= */
document.getElementById("otp-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailVal = emailInput.value.trim();
  const otp = otpInput.value.trim();
  if (!otp) return alert("Enter OTP");

  const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailVal, otp }),
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message);

  localStorage.setItem("email", emailVal);
  localStorage.setItem("otpVerified", "true");

  window.location.href = "student-details.html";
});

/* ================= LOAD CERTIFICATES ================= */
async function loadCertificates() {
  certificateSelect.innerHTML = `<option value="">Select</option>`;
  const res = await fetch(`${API_BASE}/api/certificates`);
  const certs = await res.json();

  certs.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    certificateSelect.appendChild(opt);
  });
}

/* ================= SHOW OTHER ================= */
certificateSelect?.addEventListener("change", () => {
  otherFields?.classList.toggle(
    "hidden",
    certificateSelect.value !== "Other"
  );
});

/* ================= APPLY ================= */
document
  .getElementById("application-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = localStorage.getItem("email");
    const usn = localStorage.getItem("usn");

    if (!email || !usn) {
      alert("Session expired. Please login again.");
      return;
    }

    const payload = {
      usn,
      email,
      certificateType: certificateSelect.value,
      copyType: document.getElementById("copy-type").value,
      copies: document.getElementById("copies").value,
      otherReason: document.getElementById("other-reason")?.value || null,
      otherDescription:
        document.getElementById("other-description")?.value || null,
    };

    const res = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    document.getElementById("application-message").innerHTML = `
      <p class="success">
        ✅ Payment successful and application submitted successfully<br>
        📧 Confirmation sent to your registered email
      </p>
    `;
  });
