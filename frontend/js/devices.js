// ==========================================================
// AquaSense - Devices section logic
// ==========================================================

async function loadDevices() {
    try {
        const devices = await apiGet("/devices");
        const tbody = document.getElementById("devicesTableBody");
        tbody.innerHTML = devices.map(d => `
            <tr>
                <td>${d.device_id}</td>
                <td>${d.device_name}</td>
                <td>${d.device_type}</td>
                <td>${statusPillHTML(d.status)}</td>
                <td>${d.tank_name}</td>
                <td>${formatTime(d.last_seen)}</td>
                <td><button class="btn-primary" onclick="deleteDevice(${d.device_id})">Delete</button></td>
            </tr>
        `).join("") || `<tr><td colspan="7">No devices found</td></tr>`;
    } catch (err) {
        console.error(err);
    }
}

function openAddDeviceForm() {
    document.getElementById("addDeviceForm").classList.toggle("hidden");
}

async function submitAddDevice() {
    const device_name = document.getElementById("deviceNameInput").value.trim();
    const device_type = document.getElementById("deviceTypeInput").value.trim();
    const tank_id = parseInt(document.getElementById("deviceTankIdInput").value);

    if (!device_name || !device_type || !tank_id) {
        alert("Please fill device name, type and tank ID.");
        return;
    }

    try {
        await apiPost("/devices", { device_name, device_type, tank_id });
        document.getElementById("addDeviceForm").classList.add("hidden");
        await loadDevices();
    } catch (err) {
        alert("Could not add device. Check the backend / values entered.");
    }
}

async function deleteDevice(deviceId) {
    if (!confirm("Delete this device? This will also remove its sensor readings.")) return;
    try {
        await apiDelete(`/devices/${deviceId}`);
        await loadDevices();
    } catch (err) {
        alert("Could not delete device.");
    }
}