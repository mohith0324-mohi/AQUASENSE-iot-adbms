// ==========================================================
// AquaSense - API helper
// All frontend modules use this to talk to the Flask backend.
// ==========================================================

const API_BASE = "http://127.0.0.1:5000/api";

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
}

async function apiPost(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
}

async function apiPut(path, data) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json();
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
}

function formatTime(ts) {
    if (!ts) return "-";
    const d = new Date(ts);
    return d.toLocaleString();
}

function statusPillHTML(status) {
    if (!status) return "-";
    const cls = `status-${status.toLowerCase()}`;
    return `<span class="status-pill ${cls}">${status}</span>`;
}
