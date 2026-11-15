
const allocationForm = document.getElementById("allocationForm");
const allocationTableBody = document.getElementById("allocationTableBody");
const allocationMessage = document.getElementById("allocationMessage");

let allocations =
    JSON.parse(localStorage.getItem("givetrackAllocations")) || [];

function displayAllocations() {
    allocationTableBody.innerHTML = "";

    allocations.forEach((allocation, index) => {
        const row = document.createElement("tr");

        [
            index + 1,
            allocation.donationId,
            allocation.beneficiaryId,
            "₹" + Number(allocation.amount).toFixed(2),
            allocation.date,
            allocation.purpose,
            allocation.status
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        allocationTableBody.appendChild(row);
    });
}

allocationForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const allocation = {
        donationId: document.getElementById("donationId").value,
        beneficiaryId: document.getElementById("beneficiaryId").value,
        amount: document.getElementById("allocationAmount").value,
        date: document.getElementById("allocationDate").value,
        purpose: document.getElementById("allocationPurpose").value.trim(),
        status: document.getElementById("allocationStatus").value
    };

    if (Number(allocation.amount) <= 0) {
        allocationMessage.textContent = "Enter a valid allocation amount.";
        return;
    }

    allocations.push(allocation);

    localStorage.setItem(
        "givetrackAllocations",
        JSON.stringify(allocations)
    );

    displayAllocations();
    allocationForm.reset();

    allocationMessage.textContent =
        "Allocation recorded successfully!";
});

displayAllocations();
