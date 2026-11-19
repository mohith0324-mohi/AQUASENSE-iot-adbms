// ==========================================================
// AquaSense - Main app logic (navigation + background animation)
// ==========================================================

const sectionLoaders = {
    "overview": loadOverview,
    "tanks": loadTanks,
    "devices": loadDevices,
    "sensor-readings": loadSensorReadings,
    "feed-events": loadFeedEvents,
    "users": loadUsers
};

function switchSection(sectionId) {
    document.querySelectorAll(".dashboard-section").forEach(sec => {
        sec.classList.toggle("active-section", sec.id === sectionId);
    });
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.section === sectionId);
    });

    const loader = sectionLoaders[sectionId];
    if (loader) loader();
}

function initNavigation() {
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => switchSection(btn.dataset.section));
    });
}

function initRefreshButton() {
    const btn = document.getElementById("refreshBtn");
    if (btn) btn.addEventListener("click", refreshIotData);
}

// ----------------------------------------------------------
// Aqua background: bubbles rising + fish swimming across screen
// ----------------------------------------------------------
function initAquaBackground() {
    const container = document.getElementById("aquaBackground");
    const fishEmojis = ["🐠", "🐟", "🐡", "🐬"];

    // Bubbles
    for (let i = 0; i < 25; i++) {
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        const size = Math.random() * 18 + 6;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}vw`;
        bubble.style.animationDuration = `${Math.random() * 10 + 8}s`;
        bubble.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(bubble);
    }

    // Fish
    for (let i = 0; i < 7; i++) {
        const fish = document.createElement("div");
        fish.className = "fish" + (Math.random() > 0.5 ? " reverse" : "");
        fish.textContent = fishEmojis[Math.floor(Math.random() * fishEmojis.length)];
        fish.style.top = `${Math.random() * 85 + 5}vh`;
        fish.style.animationDuration = `${Math.random() * 12 + 14}s`;
        fish.style.animationDelay = `${Math.random() * 10}s`;
        fish.style.fontSize = `${Math.random() * 1.4 + 1.4}rem`;
        container.appendChild(fish);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initAquaBackground();
    initNavigation();
    initRefreshButton();
    loadOverview(); // initial section shown on load
});
