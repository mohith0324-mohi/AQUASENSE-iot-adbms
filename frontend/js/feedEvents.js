// ==========================================================
// AquaSense - Feed Events section logic
// ==========================================================

async function loadFeedEvents() {
    try {
        const feeds = await apiGet("/feed-events");
        const tbody = document.getElementById("feedEventsTableBody");
        tbody.innerHTML = feeds.map(f => `
            <tr>
                <td>${f.feed_id}</td>
                <td>${f.tank_name}</td>
                <td>${f.username}</td>
                <td>${f.feed_mode}</td>
                <td>${f.portion_seconds}</td>
                <td>${statusPillHTML(f.status)}</td>
                <td>${formatTime(f.feed_time)}</td>
                <td><button class="btn-primary" onclick="deleteFeedEvent(${f.feed_id})">Delete</button></td>
            </tr>
        `).join("") || `<tr><td colspan="8">No feed events found</td></tr>`;
    } catch (err) {
        console.error(err);
    }
}

function openAddFeedForm() {
    document.getElementById("addFeedForm").classList.toggle("hidden");
}

async function submitAddFeed() {
    const tank_id = parseInt(document.getElementById("feedTankIdInput").value);
    const user_id = parseInt(document.getElementById("feedUserIdInput").value);
    const feed_mode = document.getElementById("feedModeInput").value;
    const portion_seconds = parseInt(document.getElementById("feedPortionInput").value);

    if (!tank_id || !user_id || !portion_seconds) {
        alert("Please fill tank ID, user ID and portion seconds.");
        return;
    }

    try {
        await apiPost("/feed-events", { tank_id, user_id, feed_mode, portion_seconds });
        document.getElementById("addFeedForm").classList.add("hidden");
        await loadFeedEvents();
    } catch (err) {
        alert("Could not log feed event. Check the backend / values entered.");
    }
}

async function deleteFeedEvent(feedId) {
    if (!confirm("Delete this feed event?")) return;
    try {
        await apiDelete(`/feed-events/${feedId}`);
        await loadFeedEvents();
    } catch (err) {
        alert("Could not delete feed event.");
    }
}