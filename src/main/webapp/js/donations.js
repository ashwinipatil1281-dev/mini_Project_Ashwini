
const donationForm = document.getElementById("donationForm");
const donationTableBody = document.getElementById("donationTableBody");
const donationMessage = document.getElementById("donationMessage");

const donationSearch = document.getElementById("donationSearch");
const searchMessage = document.getElementById("searchMessage");
const searchResults = document.getElementById("searchResults");

let donations =
    JSON.parse(localStorage.getItem("givetrackDonations")) || [];

// Display all donations
function displayDonations() {
    donationTableBody.innerHTML = "";

    donations.forEach((donation, index) => {
        const row = document.createElement("tr");

        [
            index + 1,
            donation.donorId,
            "₹" + Number(donation.amount).toFixed(2),
            donation.date,
            donation.paymentMode,
            donation.purpose
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        donationTableBody.appendChild(row);
    });
}

// Record a new donation
donationForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const donation = {
        donorId: document.getElementById("donorId").value,
        amount: document.getElementById("donationAmount").value,
        date: document.getElementById("donationDate").value,
        paymentMode: document.getElementById("paymentMode").value,
        purpose: document.getElementById("donationPurpose").value.trim()
    };

    if (Number(donation.amount) <= 0) {
        donationMessage.textContent = "Enter a valid donation amount.";
        return;
    }

    donations.push(donation);

    localStorage.setItem(
        "givetrackDonations",
        JSON.stringify(donations)
    );

    displayDonations();
    donationForm.reset();

    donationMessage.textContent = "Donation recorded successfully!";
});

// Search donations
function searchDonations() {
    const query = donationSearch.value.trim().toLowerCase();

    searchMessage.textContent = "";
    searchResults.replaceChildren();

    if (query === "") {
        searchMessage.textContent = "Please enter something to search.";
        return;
    }

    const matchingDonations = donations.filter(donation => {
        return [
            donation.donorId,
            donation.amount,
            donation.date,
            donation.paymentMode,
            donation.purpose
        ].some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });

    if (matchingDonations.length === 0) {
        searchMessage.textContent =
            "Nothing Found! No matching donation records.";
        return;
    }

    if (matchingDonations.length > 10) {
        searchMessage.textContent =
            "Too Many Found! " + matchingDonations.length +
            " records found. Please refine your search.";
        return;
    }

    searchMessage.textContent =
        matchingDonations.length + " donation record(s) found.";

    displaySearchResults(matchingDonations);
}

// Display search results
function displaySearchResults(records) {
    const table = document.createElement("table");

    const headers = [
        "Donor ID",
        "Amount",
        "Date",
        "Payment Mode",
        "Purpose"
    ];

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    records.forEach(donation => {
        const row = document.createElement("tr");

        [
            donation.donorId,
            "₹" + Number(donation.amount).toFixed(2),
            donation.date,
            donation.paymentMode,
            donation.purpose
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    searchResults.appendChild(table);
}

// Search when Enter is pressed
donationSearch.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchDonations();
    }
});

// Initial display
displayDonations();
window.searchDonations = searchDonations;