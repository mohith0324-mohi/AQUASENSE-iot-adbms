// ==========================================================
// AquaSense - Sensor Readings section logic
// ==========================================================

async function loadSensorReadings() {
    try {
        const readings = await apiGet("/sensor-readings");
        const tbody = document.getElementById("sensorReadingsTableBody");
        tbody.innerHTML = readings.map(r => `
            <tr>
                <td>${r.reading_id}</td>
                <td>${r.tank_name}</td>
                <td>${r.device_name}</td>
                <td>${r.parameter}</td>
                <td>${r.value}</td>
                <td>${r.unit || "-"}</td>
                <td>${formatTime(r.reading_time)}</td>
                <td><button class="btn-primary" onclick="deleteReading(${r.reading_id})">Delete</button></td>
            </tr>
        `).join("") || `<tr><td colspan="8">No sensor readings found</td></tr>`;
    } catch (err) {
        console.error(err);
    }
}

function openAddReadingForm() {
    document.getElementById("addReadingForm").classList.toggle("hidden");
}

async function submitAddReading() {
    const device_id = parseInt(document.getElementById("readingDeviceIdInput").value);
    const tank_id = parseInt(document.getElementById("readingTankIdInput").value);
    const parameter = document.getElementById("readingParameterInput").value.trim();
    const value = parseFloat(document.getElementById("readingValueInput").value);
    const unit = document.getElementById("readingUnitInput").value.trim();

    if (!device_id || !tank_id || !parameter || isNaN(value)) {
        alert("Please fill device ID, tank ID, parameter and value.");
        return;
    }

    try {
        await apiPost("/sensor-readings", { device_id, tank_id, parameter, value, unit });
        document.getElementById("addReadingForm").classList.add("hidden");
        await loadSensorReadings();
    } catch (err) {
        alert("Could not add reading. Check the backend / values entered.");
    }
}

async function deleteReading(readingId) {
    if (!confirm("Delete this sensor reading?")) return;
    try {
        await apiDelete(`/sensor-readings/${readingId}`);
        await loadSensorReadings();
    } catch (err) {
        alert("Could not delete reading.");
    }
}