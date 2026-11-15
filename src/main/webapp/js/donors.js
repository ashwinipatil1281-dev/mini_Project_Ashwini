
const donorForm = document.getElementById("donorForm");
const donorTableBody = document.getElementById("donorTableBody");
const donorMessage = document.getElementById("donorMessage");

// Load saved donors from browser storage
let donors = JSON.parse(localStorage.getItem("givetrackDonors")) || [];

function displayDonors() {
    donorTableBody.innerHTML = "";

    donors.forEach((donor, index) => {
        const row = document.createElement("tr");

        [
            index + 1,
            donor.name,
            donor.phone,
            donor.email,
            donor.address
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value || "-";
            row.appendChild(cell);
        });

        donorTableBody.appendChild(row);
    });
}

donorForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const donor = {
        name: document.getElementById("donorName").value.trim(),
        phone: document.getElementById("donorPhone").value.trim(),
        email: document.getElementById("donorEmail").value.trim(),
        address: document.getElementById("donorAddress").value.trim()
    };

    if (!donor.name || !donor.phone) {
        donorMessage.textContent = "Please enter donor name and phone number.";
        return;
    }

    donors.push(donor);

    localStorage.setItem("givetrackDonors", JSON.stringify(donors));

    displayDonors();
    donorForm.reset();

    donorMessage.textContent = "Donor added successfully!";
});

displayDonors();
