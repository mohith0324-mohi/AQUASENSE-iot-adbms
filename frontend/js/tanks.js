// ==========================================================
// AquaSense - Tanks section logic
// ==========================================================

async function loadTanks() {
    try {
        const tanks = await apiGet("/tanks");
        const tbody = document.getElementById("tanksTableBody");
        tbody.innerHTML = tanks.map(t => `
            <tr>
                <td>${t.tank_id}</td>
                <td>${t.tank_name}</td>
                <td>${t.capacity}</td>
                <td>${t.location || "-"}</td>
                <td>${t.owner}</td>
                <td>${t.device_count}</td>
                <td><button class="btn-primary" onclick="deleteTank(${t.tank_id})">Delete</button></td>
            </tr>
        `).join("") || `<tr><td colspan="7">No tanks found</td></tr>`;
    } catch (err) {
        console.error(err);
    }
}

function openAddTankForm() {
    document.getElementById("addTankForm").classList.toggle("hidden");
}

async function submitAddTank() {
    const tank_name = document.getElementById("tankNameInput").value.trim();
    const capacity = parseFloat(document.getElementById("tankCapacityInput").value);
    const location = document.getElementById("tankLocationInput").value.trim();
    const user_id = parseInt(document.getElementById("tankUserIdInput").value);

    if (!tank_name || !capacity || !user_id) {
        alert("Please fill tank name, capacity and owner user_id.");
        return;
    }

    try {
        await apiPost("/tanks", { tank_name, capacity, location, user_id });
        document.getElementById("addTankForm").classList.add("hidden");
        await loadTanks();
    } catch (err) {
        alert("Could not add tank. Check the backend / values entered.");
    }
}

async function deleteTank(tankId) {
    if (!confirm("Delete this tank? This will also remove its devices, readings and feed events.")) return;
    try {
        await apiDelete(`/tanks/${tankId}`);
        await loadTanks();
    } catch (err) {
        alert("Could not delete tank.");
    }
}
