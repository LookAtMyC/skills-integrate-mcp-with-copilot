document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const userIcon = document.getElementById("user-icon");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const closeBtn = document.querySelector(".close");

  let isAdmin = document.cookie.includes("admin=true");

  // Update user icon based on admin status
  updateUserIcon();

  // Function to update user icon
  function updateUserIcon() {
    userIcon.textContent = isAdmin ? "👨‍🏫" : "👤";
    userIcon.title = isAdmin ? "Logged in as admin (click to logout)" : "Click to login";
  }

  // User icon click
  userIcon.addEventListener("click", () => {
    if (isAdmin) {
      // Logout
      logout();
    } else {
      // Show login modal
      loginModal.classList.remove("hidden");
    }
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  // Login form submit
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
      });
      const result = await response.json();

      if (result.success) {
        isAdmin = true;
        updateUserIcon();
        loginModal.classList.add("hidden");
        fetchActivities();
      } else {
        loginMessage.textContent = "Invalid credentials";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Login failed";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
    }
  });

  // Logout function
  async function logout() {
    try {
      await fetch("/logout", { method: "POST" });
      isAdmin = false;
      updateUserIcon();
      fetchActivities();
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants HTML
        const participantsHTML = details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isAdmin
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

        // Admin register form
        const registerForm = isAdmin
          ? `<div class="register-section">
              <h5>Register Student:</h5>
              <form class="register-form" data-activity="${name}">
                <input type="email" placeholder="student@mergington.edu" required />
                <button type="submit">Register</button>
              </form>
            </div>`
          : "";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${registerForm}
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to register forms
      document.querySelectorAll(".register-form").forEach((form) => {
        form.addEventListener("submit", handleRegister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle register
  async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const activity = form.getAttribute("data-activity");
    const email = form.querySelector("input").value;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        form.reset();
        fetchActivities();
      } else {
        alert(result.detail || "Registration failed");
      }
    } catch (error) {
      alert("Registration failed");
    }
  }

  // Handle unregister
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        fetchActivities();
      } else {
        alert(result.detail || "Unregistration failed");
      }
    } catch (error) {
      alert("Unregistration failed");
    }
  }

  // Initial load
  fetchActivities();
});
