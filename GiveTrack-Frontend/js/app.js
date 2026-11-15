/**
 * GiveTrack - Enterprise Single Page Application (SPA) Controller
 * Connects directly to Java Servlets via RESTful JSON APIs
 */

let currentUser = null;
let allDonors = [];
let allBeneficiaries = [];
let allDonations = [];
let allAllocations = [];
let allAuditLogs = [];
let availableDonations = [];

// ==========================================================================
// Initialization & Authentication Verification
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
    await verifySession();
    setupRouting();
    handleHashChange();
});

async function verifySession() {
    try {
        const response = await fetch("api/auth/me");
        if (!response.ok) {
            window.location.href = "index.html";
            return;
        }

        const result = await response.json();
        if (result.success && result.data) {
            currentUser = result.data;
            updateUserInterface();
        } else {
            window.location.href = "index.html";
        }
    } catch (err) {
        console.error("Session verification error:", err);
        window.location.href = "index.html";
    }
}

function updateUserInterface() {
    if (!currentUser) return;

    // Sidebar user badge
    const nameEl = document.getElementById("profileUsername");
    const roleEl = document.getElementById("profileRole");
    const avatarEl = document.getElementById("userAvatar");

    if (nameEl) nameEl.textContent = currentUser.username || currentUser.email;
    if (roleEl) roleEl.textContent = currentUser.role;
    if (avatarEl) avatarEl.textContent = (currentUser.username || "U").charAt(0).toUpperCase();

    // Role-based visibility
    if (currentUser.role !== "ADMIN") {
        document.querySelectorAll(".admin-only").forEach(el => el.classList.add("hidden"));
    }

    // Role badge styling
    if (roleEl) {
        if (currentUser.role === "ADMIN") roleEl.style.color = "#38bdf8";
        else if (currentUser.role === "DONATION_MANAGER") roleEl.style.color = "#4ade80";
        else if (currentUser.role === "ALLOCATION_MANAGER") roleEl.style.color = "#fbbf24";
        else roleEl.style.color = "#94a3b8";
    }
}

async function logout() {
    try {
        await fetch("api/auth/logout", { method: "POST" });
    } catch (err) {}
    sessionStorage.removeItem("giveTrackUser");
    window.location.href = "index.html";
}

// ==========================================================================
// SPA Routing & View Management
// ==========================================================================
function setupRouting() {
    window.addEventListener("hashchange", handleHashChange);
}

function handleHashChange() {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    switchView(hash, false);
}

function switchView(viewName, updateHash = true) {
    if (updateHash) {
        window.location.hash = viewName;
    }

    // Update active nav item
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
        const href = item.getAttribute("href");
        if (href === `#${viewName}`) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Update active section
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));

    const targetSec = document.getElementById(`view${capitalize(viewName)}`);
    if (targetSec) {
        targetSec.classList.add("active");
    }

    // Update page title
    const titleEl = document.getElementById("pageTitle");
    const subEl = document.getElementById("pageSubtitle");

    switch (viewName) {
        case "dashboard":
            titleEl.textContent = "Dashboard Overview";
            subEl.textContent = "Live financial ledger and community aid metrics";
            loadDashboardStats();
            break;
        case "donations":
            titleEl.textContent = "Community Donations";
            subEl.textContent = "All financial contributions received with remaining allocation balances";
            loadDonations();
            break;
        case "allocations":
            titleEl.textContent = "Donation Allocations";
            subEl.textContent = "Funds distributed to verified beneficiaries with audit status";
            loadAllocations();
            break;
        case "donors":
            titleEl.textContent = "Donor Directory";
            subEl.textContent = "Community contributors and cumulative donation history";
            loadDonors();
            break;
        case "beneficiaries":
            titleEl.textContent = "Beneficiary Registry";
            subEl.textContent = "Individuals, institutions and relief causes receiving assistance";
            loadBeneficiaries();
            break;
        case "audit":
            titleEl.textContent = "Audit Trail & History";
            subEl.textContent = "Immutable transaction ledger tracking all records and state changes";
            loadAuditLogs();
            break;
        case "reports":
            titleEl.textContent = "Financial & Impact Reports";
            subEl.textContent = "Comprehensive breakdown by payment mode, allocation status and contributors";
            loadReports();
            break;
    }
}

// ==========================================================================
// 1. Dashboard Module
// ==========================================================================
async function loadDashboardStats() {
    try {
        const response = await fetch("api/dashboard/stats");
        const result = await response.json();

        if (response.ok && result.success && result.data) {
            const data = result.data;

            // Update stats
            document.getElementById("statTotalDonations").textContent = formatCurrency(data.totalDonations);
            document.getElementById("statTotalAllocated").textContent = formatCurrency(data.totalAllocated);
            document.getElementById("statRemainingBalance").textContent = formatCurrency(data.remainingBalance);
            document.getElementById("topbarBalance").textContent = formatCurrency(data.remainingBalance);

            document.getElementById("statDonorCount").textContent = data.donorCount || 0;
            document.getElementById("statBeneficiaryCount").textContent = data.beneficiaryCount || 0;
            document.getElementById("statDonationCount").textContent = `${data.donationCount || 0} Donations recorded`;
            document.getElementById("statAllocatedCount").textContent = `${data.activeAllocationCount || 0} active, ${data.fulfilledAllocationCount || 0} fulfilled`;

            // Allocation progress bar
            const total = parseFloat(data.totalDonations) || 0;
            const allocated = parseFloat(data.totalAllocated) || 0;
            const percentage = total > 0 ? Math.min(100, Math.round((allocated / total) * 100)) : 0;

            const progressBar = document.getElementById("allocationProgress");
            const percentageBadge = document.getElementById("allocationPercentage");
            if (progressBar) progressBar.style.width = `${percentage}%`;
            if (percentageBadge) percentageBadge.textContent = `${percentage}% Allocated`;

            // Recent tables
            renderRecentDonations(data.recentDonations || []);
            renderRecentAllocations(data.recentAllocations || []);
        }
    } catch (err) {
        console.error("Failed to load dashboard stats:", err);
    }
}

function renderRecentDonations(list) {
    const tbody = document.getElementById("recentDonationsTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No donations recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(d => `
        <tr>
            <td><strong>${escapeHtml(d.donorName || 'Donor #' + d.donorId)}</strong></td>
            <td><strong style="color: #2563eb;">${formatCurrency(d.amount)}</strong></td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569;">${escapeHtml(d.paymentMode || 'Cash')}</span></td>
            <td>${formatDate(d.donationDate)}</td>
        </tr>
    `).join("");
}

function renderRecentAllocations(list) {
    const tbody = document.getElementById("recentAllocationsTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No allocations distributed yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(a => `
        <tr>
            <td><strong>${escapeHtml(a.beneficiaryName || 'Beneficiary #' + a.beneficiaryId)}</strong></td>
            <td><strong>${formatCurrency(a.amount)}</strong></td>
            <td>${escapeHtml(a.purpose || 'Aid distribution')}</td>
            <td>${renderStatusBadge(a.status)}</td>
        </tr>
    `).join("");
}

// ==========================================================================
// 2. Donations Module
// ==========================================================================
async function loadDonations() {
    try {
        const response = await fetch("api/donations");
        const result = await response.json();
        if (response.ok && result.success) {
            allDonations = result.data || [];
            renderDonationsTable(allDonations);
        }
    } catch (err) {
        console.error("Failed to load donations:", err);
        showToast("Error loading donation records.", "error");
    }
}

function renderDonationsTable(list) {
    const tbody = document.getElementById("donationsTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No donation records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(d => {
        const remaining = parseFloat(d.remainingBalance) || 0;
        const balanceBadge = remaining > 0
            ? `<span class="badge badge-balance-high">${formatCurrency(remaining)} Available</span>`
            : `<span class="badge badge-balance-zero">Fully Allocated</span>`;

        const canAllocate = (currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ALLOCATION_MANAGER")) && remaining > 0;

        return `
            <tr>
                <td>#${d.donationId}</td>
                <td><strong>${escapeHtml(d.donorName || 'Donor #' + d.donorId)}</strong></td>
                <td><strong>${formatCurrency(d.amount)}</strong></td>
                <td>${formatCurrency(d.allocatedAmount || 0)}</td>
                <td>${balanceBadge}</td>
                <td>${escapeHtml(d.paymentMode || 'Cash')}</td>
                <td>${formatDate(d.donationDate)}</td>
                <td>${escapeHtml(d.purpose || '-')}</td>
                <td>
                    ${canAllocate ? `<button class="btn btn-sm btn-outline" onclick="openAddAllocationModal(${d.donationId})">+ Allocate</button>` : `<span class="text-muted">-</span>`}
                </td>
            </tr>
        `;
    }).join("");
}

function filterDonations() {
    const query = document.getElementById("donationSearch").value.toLowerCase().trim();
    if (!query) {
        renderDonationsTable(allDonations);
        return;
    }
    const filtered = allDonations.filter(d =>
        (d.donorName && d.donorName.toLowerCase().includes(query)) ||
        (d.paymentMode && d.paymentMode.toLowerCase().includes(query)) ||
        (d.purpose && d.purpose.toLowerCase().includes(query))
    );
    renderDonationsTable(filtered);
}

async function openAddDonationModal() {
    // Populate donors dropdown
    try {
        const response = await fetch("api/donors");
        const result = await response.json();
        if (response.ok && result.success) {
            const select = document.getElementById("donationDonorSelect");
            select.innerHTML = `<option value="">-- Choose Donor --</option>` +
                result.data.map(d => `<option value="${d.donorId}">${escapeHtml(d.donorName)} (${d.phone || 'No phone'})</option>`).join("");
        }
    } catch (e) {}

    // Default date to today
    document.getElementById("donationDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("donationAmount").value = "";
    document.getElementById("donationPurpose").value = "";
    openModal("modalDonation");
}

async function submitDonation(event) {
    event.preventDefault();
    const donorId = parseInt(document.getElementById("donationDonorSelect").value);
    const amount = parseFloat(document.getElementById("donationAmount").value);
    const paymentMode = document.getElementById("donationPaymentMode").value;
    const donationDate = document.getElementById("donationDate").value;
    const purpose = document.getElementById("donationPurpose").value.trim();

    if (!donorId || isNaN(amount) || amount <= 0 || !donationDate) {
        showToast("Please fill all required donation fields with valid amounts.", "error");
        return;
    }

    const submitBtn = document.getElementById("donationSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Recording...";

    try {
        const response = await fetch("api/donations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donorId, amount, paymentMode, donationDate, purpose })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast("Donation recorded successfully!", "success");
            closeModal("modalDonation");
            loadDonations();
            loadDashboardStats();
        } else {
            showToast(result.message || "Failed to record donation.", "error");
        }
    } catch (err) {
        showToast("Network error while recording donation.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Record Donation";
    }
}

// ==========================================================================
// 3. Allocations Module
// ==========================================================================
async function loadAllocations() {
    try {
        const response = await fetch("api/allocations");
        const result = await response.json();
        if (response.ok && result.success) {
            allAllocations = result.data || [];
            renderAllocationsTable(allAllocations);
        }
    } catch (err) {
        console.error("Failed to load allocations:", err);
        showToast("Error loading allocation ledger.", "error");
    }
}

function renderAllocationsTable(list) {
    const tbody = document.getElementById("allocationsTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No allocation records found.</td></tr>`;
        return;
    }

    const canChangeStatus = currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ALLOCATION_MANAGER");

    tbody.innerHTML = list.map(a => {
        let statusActions = `<span class="text-muted">-</span>`;
        if (canChangeStatus) {
            if (a.status === "PENDING") {
                statusActions = `
                    <button class="btn btn-sm btn-outline" onclick="changeAllocationStatus(${a.allocationId}, 'ALLOCATED')">Approve</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="changeAllocationStatus(${a.allocationId}, 'CANCELLED')">Cancel</button>
                `;
            } else if (a.status === "ALLOCATED") {
                statusActions = `
                    <button class="btn btn-sm btn-outline" style="border-color:#10b981; color:#10b981;" onclick="changeAllocationStatus(${a.allocationId}, 'FULFILLED')">Mark Fulfilled</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="changeAllocationStatus(${a.allocationId}, 'CANCELLED')">Cancel</button>
                `;
            } else if (a.status === "FULFILLED") {
                statusActions = `<span style="color:#10b981; font-weight:600;">✓ Completed</span>`;
            } else if (a.status === "CANCELLED") {
                statusActions = `<span style="color:#ef4444; font-weight:600;">✗ Revoked</span>`;
            }
        }

        return `
            <tr>
                <td>#${a.allocationId}</td>
                <td><strong>${escapeHtml(a.beneficiaryName || 'Beneficiary #' + a.beneficiaryId)}</strong></td>
                <td>${escapeHtml(a.donorName || 'Donation #' + a.donationId)}</td>
                <td><strong style="color:#2563eb;">${formatCurrency(a.amount)}</strong></td>
                <td>${formatDate(a.allocationDate)}</td>
                <td>${escapeHtml(a.purpose || '-')}</td>
                <td>${renderStatusBadge(a.status)}</td>
                <td>${statusActions}</td>
            </tr>
        `;
    }).join("");
}

function filterAllocations() {
    const query = document.getElementById("allocationSearch").value.toLowerCase().trim();
    if (!query) {
        renderAllocationsTable(allAllocations);
        return;
    }
    const filtered = allAllocations.filter(a =>
        (a.beneficiaryName && a.beneficiaryName.toLowerCase().includes(query)) ||
        (a.donorName && a.donorName.toLowerCase().includes(query)) ||
        (a.purpose && a.purpose.toLowerCase().includes(query)) ||
        (a.status && a.status.toLowerCase().includes(query))
    );
    renderAllocationsTable(filtered);
}

async function openAddAllocationModal(preselectedDonationId = null) {
    try {
        // Load available donations with remaining balance > 0
        const donRes = await fetch("api/donations?available=true");
        const donData = await donRes.json();
        availableDonations = donData.data || [];

        const donSelect = document.getElementById("allocDonationSelect");
        if (availableDonations.length === 0) {
            showToast("No funded donations have remaining balance to allocate.", "warning");
            return;
        }

        donSelect.innerHTML = `<option value="">-- Choose Funded Donation --</option>` +
            availableDonations.map(d =>
                `<option value="${d.donationId}">Donation #${d.donationId} (${escapeHtml(d.donorName)} - Avail: ${formatCurrency(d.remainingBalance)})</option>`
            ).join("");

        if (preselectedDonationId) {
            donSelect.value = preselectedDonationId;
        }

        // Load beneficiaries
        const benRes = await fetch("api/beneficiaries");
        const benData = await benRes.json();
        const benSelect = document.getElementById("allocBeneficiarySelect");
        benSelect.innerHTML = `<option value="">-- Choose Beneficiary --</option>` +
            (benData.data || []).map(b => `<option value="${b.beneficiaryId}">${escapeHtml(b.beneficiaryName)} (${escapeHtml(b.address || 'General')})</option>`).join("");

        onDonationSelectChanged();
        document.getElementById("allocAmount").value = "";
        document.getElementById("allocPurpose").value = "";
        openModal("modalAllocation");
    } catch (e) {
        showToast("Error preparing allocation modal.", "error");
    }
}

function onDonationSelectChanged() {
    const donSelect = document.getElementById("allocDonationSelect");
    const donId = parseInt(donSelect.value);
    const box = document.getElementById("selectedDonationBalanceBox");
    const balanceEl = document.getElementById("selectedRemainingBalance");
    const amountInput = document.getElementById("allocAmount");

    const found = availableDonations.find(d => d.donationId === donId);
    if (found && found.remainingBalance) {
        box.classList.remove("hidden");
        balanceEl.textContent = formatCurrency(found.remainingBalance);
        amountInput.max = found.remainingBalance;
    } else {
        box.classList.add("hidden");
        amountInput.removeAttribute("max");
    }
}

async function submitAllocation(event) {
    event.preventDefault();
    const donationId = parseInt(document.getElementById("allocDonationSelect").value);
    const beneficiaryId = parseInt(document.getElementById("allocBeneficiarySelect").value);
    const amount = parseFloat(document.getElementById("allocAmount").value);
    const purpose = document.getElementById("allocPurpose").value.trim();
    const status = document.getElementById("allocStatus").value;

    if (!donationId || !beneficiaryId || isNaN(amount) || amount <= 0 || !purpose) {
        showToast("Please fill all required allocation fields.", "error");
        return;
    }

    const submitBtn = document.getElementById("allocSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing Allocation...";

    try {
        const response = await fetch("api/allocations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donationId, beneficiaryId, amount, purpose, status })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast("Allocation committed successfully!", "success");
            closeModal("modalAllocation");
            loadAllocations();
            loadDonations();
            loadDashboardStats();
        } else {
            showToast(result.message || "Allocation rejected by database rules.", "error");
        }
    } catch (err) {
        showToast("Network error submitting allocation.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Allocation";
    }
}

async function changeAllocationStatus(allocationId, newStatus) {
    if (!confirm(`Are you sure you want to change Allocation #${allocationId} status to ${newStatus}?`)) {
        return;
    }

    try {
        const response = await fetch("api/allocations", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allocationId, status: newStatus })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast(`Allocation #${allocationId} updated to ${newStatus}.`, "success");
            loadAllocations();
            loadDashboardStats();
        } else {
            showToast(result.message || "Failed to update allocation status.", "error");
        }
    } catch (err) {
        showToast("Network error updating status.", "error");
    }
}

// ==========================================================================
// 4. Donors Module
// ==========================================================================
async function loadDonors() {
    try {
        const response = await fetch("api/donors");
        const result = await response.json();
        if (response.ok && result.success) {
            allDonors = result.data || [];
            renderDonorsTable(allDonors);
        }
    } catch (err) {
        showToast("Failed to load donors list.", "error");
    }
}

function renderDonorsTable(list) {
    const tbody = document.getElementById("donorsTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No donor records found.</td></tr>`;
        return;
    }

    const canEdit = currentUser && (currentUser.role === "ADMIN" || currentUser.role === "DONATION_MANAGER");

    tbody.innerHTML = list.map(d => `
        <tr>
            <td>#${d.donorId}</td>
            <td><strong>${escapeHtml(d.donorName)}</strong></td>
            <td>${escapeHtml(d.phone || '-')}</td>
            <td>${escapeHtml(d.email || '-')}</td>
            <td>${escapeHtml(d.address || '-')}</td>
            <td><strong style="color:#2563eb;">${formatCurrency(d.totalDonated || 0)}</strong></td>
            <td><span class="badge" style="background:#eff6ff; color:#1e40af;">${d.donationCount || 0}</span></td>
            <td>
                ${canEdit ? `
                    <button class="btn btn-sm btn-outline" onclick="editDonor(${d.donorId})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDonor(${d.donorId})">Delete</button>
                ` : `<span class="text-muted">-</span>`}
            </td>
        </tr>
    `).join("");
}

function filterDonors() {
    const query = document.getElementById("donorSearch").value.toLowerCase().trim();
    if (!query) {
        renderDonorsTable(allDonors);
        return;
    }
    const filtered = allDonors.filter(d =>
        (d.donorName && d.donorName.toLowerCase().includes(query)) ||
        (d.phone && d.phone.toLowerCase().includes(query)) ||
        (d.email && d.email.toLowerCase().includes(query)) ||
        (d.address && d.address.toLowerCase().includes(query))
    );
    renderDonorsTable(filtered);
}

function openAddDonorModal() {
    document.getElementById("donorModalTitle").textContent = "Add New Donor";
    document.getElementById("donorId").value = "";
    document.getElementById("donorName").value = "";
    document.getElementById("donorPhone").value = "";
    document.getElementById("donorEmail").value = "";
    document.getElementById("donorAddress").value = "";
    openModal("modalDonor");
}

function editDonor(donorId) {
    const donor = allDonors.find(d => d.donorId === donorId);
    if (!donor) return;

    document.getElementById("donorModalTitle").textContent = "Edit Donor";
    document.getElementById("donorId").value = donor.donorId;
    document.getElementById("donorName").value = donor.donorName || "";
    document.getElementById("donorPhone").value = donor.phone || "";
    document.getElementById("donorEmail").value = donor.email || "";
    document.getElementById("donorAddress").value = donor.address || "";
    openModal("modalDonor");
}

async function submitDonor(event) {
    event.preventDefault();
    const donorId = document.getElementById("donorId").value;
    const donorName = document.getElementById("donorName").value.trim();
    const phone = document.getElementById("donorPhone").value.trim();
    const email = document.getElementById("donorEmail").value.trim();
    const address = document.getElementById("donorAddress").value.trim();

    if (!donorName) {
        showToast("Donor name is required.", "error");
        return;
    }

    const isUpdate = !!donorId;
    const method = isUpdate ? "PUT" : "POST";
    const payload = { donorName, phone, email, address };
    if (isUpdate) payload.donorId = parseInt(donorId);

    try {
        const response = await fetch("api/donors", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast(`Donor ${isUpdate ? 'updated' : 'added'} successfully!`, "success");
            closeModal("modalDonor");
            loadDonors();
            loadDashboardStats();
        } else {
            showToast(result.message || "Failed to save donor.", "error");
        }
    } catch (err) {
        showToast("Network error saving donor.", "error");
    }
}

async function deleteDonor(donorId) {
    if (!confirm(`Are you sure you want to delete Donor #${donorId}?`)) {
        return;
    }

    try {
        const response = await fetch(`api/donors?id=${donorId}`, { method: "DELETE" });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast("Donor deleted successfully.", "success");
            loadDonors();
            loadDashboardStats();
        } else {
            showToast(result.message || "Cannot delete donor with linked donations.", "error");
        }
    } catch (err) {
        showToast("Network error deleting donor.", "error");
    }
}

// ==========================================================================
// 5. Beneficiaries Module
// ==========================================================================
async function loadBeneficiaries() {
    try {
        const response = await fetch("api/beneficiaries");
        const result = await response.json();
        if (response.ok && result.success) {
            allBeneficiaries = result.data || [];
            renderBeneficiariesTable(allBeneficiaries);
        }
    } catch (err) {
        showToast("Failed to load beneficiaries list.", "error");
    }
}

function renderBeneficiariesTable(list) {
    const tbody = document.getElementById("beneficiariesTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No beneficiary records found.</td></tr>`;
        return;
    }

    const canEdit = currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ALLOCATION_MANAGER");

    tbody.innerHTML = list.map(b => `
        <tr>
            <td>#${b.beneficiaryId}</td>
            <td><strong>${escapeHtml(b.beneficiaryName)}</strong></td>
            <td>${escapeHtml(b.phone || '-')}</td>
            <td>${escapeHtml(b.address || '-')}</td>
            <td>${escapeHtml(b.requirementDetails || '-')}</td>
            <td><strong style="color:#10b981;">${formatCurrency(b.totalAllocated || 0)}</strong></td>
            <td>
                ${canEdit ? `
                    <button class="btn btn-sm btn-outline" onclick="editBeneficiary(${b.beneficiaryId})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBeneficiary(${b.beneficiaryId})">Delete</button>
                ` : `<span class="text-muted">-</span>`}
            </td>
        </tr>
    `).join("");
}

function filterBeneficiaries() {
    const query = document.getElementById("beneficiarySearch").value.toLowerCase().trim();
    if (!query) {
        renderBeneficiariesTable(allBeneficiaries);
        return;
    }
    const filtered = allBeneficiaries.filter(b =>
        (b.beneficiaryName && b.beneficiaryName.toLowerCase().includes(query)) ||
        (b.phone && b.phone.toLowerCase().includes(query)) ||
        (b.address && b.address.toLowerCase().includes(query)) ||
        (b.requirementDetails && b.requirementDetails.toLowerCase().includes(query))
    );
    renderBeneficiariesTable(filtered);
}

function openAddBeneficiaryModal() {
    document.getElementById("beneficiaryModalTitle").textContent = "Add Beneficiary";
    document.getElementById("beneficiaryId").value = "";
    document.getElementById("beneficiaryName").value = "";
    document.getElementById("beneficiaryPhone").value = "";
    document.getElementById("beneficiaryAddress").value = "";
    document.getElementById("beneficiaryDetails").value = "";
    openModal("modalBeneficiary");
}

function editBeneficiary(beneficiaryId) {
    const b = allBeneficiaries.find(item => item.beneficiaryId === beneficiaryId);
    if (!b) return;

    document.getElementById("beneficiaryModalTitle").textContent = "Edit Beneficiary";
    document.getElementById("beneficiaryId").value = b.beneficiaryId;
    document.getElementById("beneficiaryName").value = b.beneficiaryName || "";
    document.getElementById("beneficiaryPhone").value = b.phone || "";
    document.getElementById("beneficiaryAddress").value = b.address || "";
    document.getElementById("beneficiaryDetails").value = b.requirementDetails || "";
    openModal("modalBeneficiary");
}

async function submitBeneficiary(event) {
    event.preventDefault();
    const beneficiaryId = document.getElementById("beneficiaryId").value;
    const beneficiaryName = document.getElementById("beneficiaryName").value.trim();
    const phone = document.getElementById("beneficiaryPhone").value.trim();
    const address = document.getElementById("beneficiaryAddress").value.trim();
    const requirementDetails = document.getElementById("beneficiaryDetails").value.trim();

    if (!beneficiaryName) {
        showToast("Beneficiary name is required.", "error");
        return;
    }

    const isUpdate = !!beneficiaryId;
    const method = isUpdate ? "PUT" : "POST";
    const payload = { beneficiaryName, phone, address, requirementDetails };
    if (isUpdate) payload.beneficiaryId = parseInt(beneficiaryId);

    try {
        const response = await fetch("api/beneficiaries", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast(`Beneficiary ${isUpdate ? 'updated' : 'added'} successfully!`, "success");
            closeModal("modalBeneficiary");
            loadBeneficiaries();
            loadDashboardStats();
        } else {
            showToast(result.message || "Failed to save beneficiary.", "error");
        }
    } catch (err) {
        showToast("Network error saving beneficiary.", "error");
    }
}

async function deleteBeneficiary(beneficiaryId) {
    if (!confirm(`Are you sure you want to delete Beneficiary #${beneficiaryId}?`)) {
        return;
    }

    try {
        const response = await fetch(`api/beneficiaries?id=${beneficiaryId}`, { method: "DELETE" });
        const result = await response.json();

        if (response.ok && result.success) {
            showToast("Beneficiary deleted successfully.", "success");
            loadBeneficiaries();
            loadDashboardStats();
        } else {
            showToast(result.message || "Cannot delete beneficiary with linked allocations.", "error");
        }
    } catch (err) {
        showToast("Network error deleting beneficiary.", "error");
    }
}

// ==========================================================================
// 6. Audit Trail Module
// ==========================================================================
async function loadAuditLogs() {
    try {
        const response = await fetch("api/audit-logs");
        const result = await response.json();
        if (response.ok && result.success) {
            allAuditLogs = result.data || [];
            renderAuditTable(allAuditLogs);
        } else {
            showToast(result.message || "Unauthorized for audit logs.", "error");
        }
    } catch (err) {
        showToast("Failed to load audit trail.", "error");
    }
}

function renderAuditTable(list) {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No audit trail events recorded.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(log => `
        <tr>
            <td>#${log.auditId}</td>
            <td>${formatTimestamp(log.changedAt)}</td>
            <td><strong>${escapeHtml(log.username || 'User #' + log.userId)}</strong></td>
            <td><span class="badge" style="background:#e2e8f0; color:#334155;">${escapeHtml(log.userRole || '-')}</span></td>
            <td><span class="badge badge-allocated">${escapeHtml(log.actionType)}</span></td>
            <td><code>${escapeHtml(log.tableName)}</code></td>
            <td>#${log.recordId}</td>
            <td><small style="font-family:monospace; color:#475569;">${escapeHtml(log.newValue || log.oldValue || '-')}</small></td>
        </tr>
    `).join("");
}

function filterAuditLogs() {
    const query = document.getElementById("auditSearch").value.toLowerCase().trim();
    if (!query) {
        renderAuditTable(allAuditLogs);
        return;
    }
    const filtered = allAuditLogs.filter(l =>
        (l.username && l.username.toLowerCase().includes(query)) ||
        (l.actionType && l.actionType.toLowerCase().includes(query)) ||
        (l.tableName && l.tableName.toLowerCase().includes(query))
    );
    renderAuditTable(filtered);
}

// ==========================================================================
// 7. Reports Module
// ==========================================================================
async function loadReports() {
    try {
        const response = await fetch("api/reports/summary");
        const result = await response.json();

        if (response.ok && result.success && result.data) {
            const data = result.data;

            // Payment modes table
            const pBody = document.getElementById("reportPaymentModesBody");
            if (pBody) {
                pBody.innerHTML = (data.paymentModes || []).map(p => `
                    <tr>
                        <td><strong>${escapeHtml(p.mode)}</strong></td>
                        <td>${p.count}</td>
                        <td><strong>${formatCurrency(p.total)}</strong></td>
                    </tr>
                `).join("");
            }

            // Status breakdown table
            const sBody = document.getElementById("reportStatusBody");
            if (sBody) {
                sBody.innerHTML = (data.statusBreakdown || []).map(s => `
                    <tr>
                        <td>${renderStatusBadge(s.status)}</td>
                        <td>${s.count}</td>
                        <td><strong>${formatCurrency(s.total)}</strong></td>
                    </tr>
                `).join("");
            }

            // Top donors table
            const dBody = document.getElementById("reportTopDonorsBody");
            if (dBody) {
                dBody.innerHTML = (data.topDonors || []).map(d => `
                    <tr>
                        <td><strong>${escapeHtml(d.donorName)}</strong></td>
                        <td>${d.count}</td>
                        <td><strong style="color:#2563eb;">${formatCurrency(d.total)}</strong></td>
                    </tr>
                `).join("");
            }
        }
    } catch (err) {
        showToast("Error generating report.", "error");
    }
}

// ==========================================================================
// Quick Action Modal Helper
// ==========================================================================
function openQuickActionModal() {
    if (currentUser && currentUser.role === "DONATION_MANAGER") {
        openAddDonationModal();
    } else if (currentUser && currentUser.role === "ALLOCATION_MANAGER") {
        openAddAllocationModal();
    } else {
        openAddDonationModal();
    }
}

// ==========================================================================
// UI Helpers, Modals & Toast System
// ==========================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("hidden");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("hidden");
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : (type === "warning" ? "⚠️" : "✕");
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    return dateStr;
}

function formatTimestamp(tsStr) {
    if (!tsStr) return "-";
    return tsStr;
}

function renderStatusBadge(status) {
    const s = (status || "PENDING").toUpperCase();
    if (s === "PENDING") return `<span class="badge badge-pending">PENDING</span>`;
    if (s === "ALLOCATED") return `<span class="badge badge-allocated">ALLOCATED</span>`;
    if (s === "FULFILLED") return `<span class="badge badge-fulfilled">FULFILLED</span>`;
    if (s === "CANCELLED") return `<span class="badge badge-cancelled">CANCELLED</span>`;
    return `<span class="badge">${escapeHtml(s)}</span>`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}
