// admin.js

document.addEventListener("DOMContentLoaded", function () {
  // Check via backend if an admin password is set.
  fetch("https://hie-xtry.onrender.com/api/admin/check")
    .then(response => response.json())
    .then(data => {
      if (data.passwordSet) {
        // If a password is set, show the login form.
        document.getElementById("admin-login").style.display = "block";
      } else {
        // Otherwise, show the admin panel directly.
        document.getElementById("admin-panel").style.display = "block";
      }
    })
    .catch(err => console.error("Error checking admin:", err));
});

document.getElementById("admin-login-button").addEventListener("click", function () {
  const inputPass = document.getElementById("admin-password-input").value;
  fetch("https://hie-xtry.onrender.com/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: inputPass })
  })
    .then(response => {
      if (!response.ok) throw new Error("Incorrect password");
      return response.json();
    })
    .then(data => {
      document.getElementById("admin-login").style.display = "none";
      document.getElementById("admin-panel").style.display = "block";
    })
    .catch(err => {
      document.getElementById("login-error").textContent = err.message;
    });
});

document.getElementById("set-password-button").addEventListener("click", function () {
  const newPass = document.getElementById("new-admin-password").value;
  if (!newPass) {
    document.getElementById("password-message").textContent = "Please enter a password.";
    return;
  }
  fetch("https://hie-xtry.onrender.com/api/admin/set-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: newPass })
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById("password-message").textContent = data.message;
    })
    .catch(err => console.error("Error setting password:", err));
});
