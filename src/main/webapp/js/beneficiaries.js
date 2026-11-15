
const beneficiaryForm = document.getElementById("beneficiaryForm");
const beneficiaryTableBody = document.getElementById("beneficiaryTableBody");
const beneficiaryMessage = document.getElementById("beneficiaryMessage");

let beneficiaries =
    JSON.parse(localStorage.getItem("givetrackBeneficiaries")) || [];

function displayBeneficiaries() {
    beneficiaryTableBody.innerHTML = "";

    beneficiaries.forEach((beneficiary, index) => {
        const row = document.createElement("tr");

        [
            index + 1,
            beneficiary.name,
            beneficiary.phone,
            beneficiary.address,
            beneficiary.requirements
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value || "-";
            row.appendChild(cell);
        });

        beneficiaryTableBody.appendChild(row);
    });
}

beneficiaryForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const beneficiary = {
        name: document.getElementById("beneficiaryName").value.trim(),
        phone: document.getElementById("beneficiaryPhone").value.trim(),
        address: document.getElementById("beneficiaryAddress").value.trim(),
        requirements: document.getElementById("requirementDetails").value.trim()
    };

    beneficiaries.push(beneficiary);

    localStorage.setItem(
        "givetrackBeneficiaries",
        JSON.stringify(beneficiaries)
    );

    displayBeneficiaries();
    beneficiaryForm.reset();

    beneficiaryMessage.textContent =
        "Beneficiary added successfully!";
});

displayBeneficiaries();
