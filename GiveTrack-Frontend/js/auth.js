// GiveTrack - Authentication Handler

function fillCredentials(email, password) {
    document.getElementById("email").value = email;
    document.getElementById("password").value = password;
    clearAlert();
}

function showAlert(message, type = "danger") {
    const box = document.getElementById("alertBox");
    box.className = `alert alert-${type}`;
    box.textContent = message;
    box.classList.remove("hidden");
}

function clearAlert() {
    const box = document.getElementById("alertBox");
    box.className = "alert hidden";
    box.textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const submitBtn = document.getElementById("submitBtn");
        const btnText = submitBtn.querySelector(".btn-text");
        const btnLoader = submitBtn.querySelector(".btn-loader");

        if (!email || !password) {
            showAlert("Please enter both email and password.");
            return;
        }

        try {
            submitBtn.disabled = true;
            btnText.classList.add("hidden");
            btnLoader.classList.remove("hidden");

            const response = await fetch("api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Save user profile in sessionStorage
                sessionStorage.setItem("giveTrackUser", JSON.stringify(result.data));
                window.location.href = "dashboard.html";
            } else {
                showAlert(result.message || "Invalid login credentials.");
            }
        } catch (err) {
            console.error("Login request failed:", err);
            showAlert("Unable to connect to server. Ensure Tomcat is running.");
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove("hidden");
            btnLoader.classList.add("hidden");
        }
    });
});
