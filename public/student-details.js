const API_BASE = "";

const form = document.getElementById("details-form");
const messageDiv = document.getElementById("details-message");

const email = localStorage.getItem("email");
const otpVerified = localStorage.getItem("otpVerified");

// 🚫 MUST come from OTP
if (!email || otpVerified !== "true") {
  window.location.href = "student.html";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageDiv.textContent = "";

  const name = document.getElementById("name").value.trim();
  const usn = document.getElementById("usn").value.trim();
  const branch = document.getElementById("branch").value.trim();
  const yearOfPassing = document.getElementById("year").value.trim();
  const address = document.getElementById("address").value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/student/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usn,
        name,
        email,
        branch,
        yearOfPassing,
        address,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      messageDiv.textContent = data.message || "Failed to save details";
      messageDiv.className = "error";
      return;
    }

    // ✅ REQUIRED FLAGS (THIS WAS MISSING)
    localStorage.setItem("usn", usn);
    localStorage.setItem("detailsCompleted", "true");
    sessionStorage.setItem("fromDetails", "true"); // 🔥 FIX

    window.location.href = "student.html";
  } catch (err) {
    console.error(err);
    messageDiv.textContent = "Something went wrong";
    messageDiv.className = "error";
  }
});
