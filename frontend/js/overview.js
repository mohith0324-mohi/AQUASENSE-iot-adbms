// ==========================================================
// AquaSense - Overview section logic
// ==========================================================

async function loadOverview() {
    try {
        const data = await apiGet("/overview");

        const statCards = document.getElementById("statCards");
        const completedFeeds = (data.feed_status_counts.find(f => f.status === "completed") || {}).c || 0;

        statCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.total_tanks}</div>
                <div class="stat-label">Total Tanks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.active_devices} / ${data.total_devices}</div>
                <div class="stat-label">Active Devices</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.latest_readings.length}</div>
                <div class="stat-label">Recent Readings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${completedFeeds}</div>
                <div class="stat-label">Completed Feed Events</div>
            </div>
        `;

        const tbody = document.querySelector("#latestReadingsTable tbody");
        tbody.innerHTML = data.latest_readings.map(r => `
            <tr>
                <td>${r.tank_name}</td>
                <td>${r.parameter}</td>
                <td>${r.value}</td>
                <td>${formatTime(r.reading_time)}</td>
            </tr>
        `).join("") || `<tr><td colspan="4">No readings yet</td></tr>`;

        const panel = document.getElementById("tankStatusPanel");
        panel.innerHTML = data.tank_status.map(t => `
            <div class="tank-chip">
                <span>${t.tank_name} (${t.capacity} L)</span>
                <span class="badge">${t.device_count} devices</span>
            </div>
        `).join("");

        setConnectionStatus(true);
    } catch (err) {
        console.error(err);
        setConnectionStatus(false);
    }
}

function setConnectionStatus(online) {
    const dot = document.getElementById("connectionDot");
    const text = document.getElementById("connectionText");
    if (online) {
        dot.className = "dot dot-online";
        text.textContent = "API Connected";
    } else {
        dot.className = "dot dot-offline";
        text.textContent = "API Offline - start Flask backend";
    }
}

async function refreshIotData() {
    const btn = document.getElementById("refreshBtn");
    btn.disabled = true;
    btn.textContent = "Refreshing...";
    try {
        const result = await apiPost("/refresh", {});
        alert(result.message);
        await loadOverview();
    } catch (err) {
        alert("Could not refresh IoT data. Is the Flask backend running?");
    } finally {
        btn.disabled = false;
        btn.textContent = "🔄 Refresh IoT Data";
    }
}
