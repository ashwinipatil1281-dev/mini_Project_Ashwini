
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(event) {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    message.textContent = "";

    if (email === "" || password === "") {
        event.preventDefault();
        message.textContent = "Please fill in all fields.";
        return;
    }

    if (password.length < 6) {
        event.preventDefault();
        message.textContent =
            "Password must contain at least 6 characters.";
    }

});
