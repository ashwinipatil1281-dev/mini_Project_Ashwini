
function showMessage(message) {
    document.getElementById("dashboardMessage").textContent = message;
}

// Maximum number of results to display
const MAX_SEARCH_RESULTS = 10;

let donations = [];
let allocations = [];

// Load saved data
document.addEventListener("DOMContentLoaded", function () {

    try {
        donations = JSON.parse(
            localStorage.getItem("donations") || "[]"
        );

        allocations = JSON.parse(
            localStorage.getItem("allocations") || "[]"
        );

        if (!Array.isArray(donations)) donations = [];
        if (!Array.isArray(allocations)) allocations = [];

    } catch (error) {
        donations = [];
        allocations = [];
        console.error("Error loading saved data:", error);
    }

    console.log("Donations:", donations);
    console.log("Allocations:", allocations);

    // Search when Enter is pressed
    const searchInput = document.getElementById("donationSearch");

    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                searchDonations();
            }
        });
    }

});

// Donation Search Function
function searchDonations() {

    const searchInput = document.getElementById("donationSearch");
    const message = document.getElementById("searchMessage");
    const results = document.getElementById("searchResults");

    const query = searchInput.value.trim().toLowerCase();

    message.textContent = "";
    results.replaceChildren();

    if (query === "") {
        message.textContent = "Please enter something to search.";
        return;
    }

    // Find matching donations
    const matchingDonations = donations.filter(function (donation) {

        return Object.values(donation)
            .some(function (value) {
                return String(value ?? "")
                    .toLowerCase()
                    .includes(query);
            });

    });

    // NOTHING FOUND
    if (matchingDonations.length === 0) {

        message.textContent =
            "Nothing Found! No matching donation records.";

        message.className = "search-empty";

        return;
    }

    // TOO MANY FOUND
    if (matchingDonations.length > MAX_SEARCH_RESULTS) {

        message.textContent =
            "Too Many Found! " +
            matchingDonations.length +
            " records found. Please refine your search.";

        message.className = "search-warning";

        return;
    }

    // NORMAL SEARCH RESULTS
    message.className = "";
    message.textContent =
        matchingDonations.length + " donation record(s) found.";

    displaySearchResults(matchingDonations);
}

// Display Matching Donations
function displaySearchResults(records) {

    const results = document.getElementById("searchResults");

    const table = document.createElement("table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = [
        "Donor",
        "Date",
        "Donation Type",
        "Amount"
    ];

    headers.forEach(function (header) {

        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);

    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    records.forEach(function (donation) {

        const row = document.createElement("tr");

        const donor =
            donation.donorName ||
            donation.donor_name ||
            donation.donor ||
            donation.name ||
            "N/A";

        const date =
            donation.donationDate ||
            donation.donation_date ||
            donation.date ||
            "N/A";

        const type =
            donation.donationType ||
            donation.donation_type ||
            donation.type ||
            "N/A";

        const amount =
            donation.amount ??
            donation.donationAmount ??
            donation.donation_amount ??
            "N/A";

        [donor, date, type, amount].forEach(function (value) {

            const td = document.createElement("td");
            td.textContent = String(value);
            row.appendChild(td);

        });

        tbody.appendChild(row);

    });

    table.appendChild(tbody);
    results.appendChild(table);
}
