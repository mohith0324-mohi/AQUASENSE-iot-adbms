// ==========================================================
// AquaSense - Users section logic
// ==========================================================

async function loadUsers() {
    try {
        const users = await apiGet("/users");
        const tbody = document.getElementById("usersTableBody");
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.user_id}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td><button class="btn-primary" onclick="deleteUser(${u.user_id})">Delete</button></td>
            </tr>
        `).join("") || `<tr><td colspan="5">No users found</td></tr>`;
    } catch (err) {
        console.error(err);
    }
}

function openAddUserForm() {
    document.getElementById("addUserForm").classList.toggle("hidden");
}

async function submitAddUser() {
    const username = document.getElementById("userUsernameInput").value.trim();
    const email = document.getElementById("userEmailInput").value.trim();
    const password = document.getElementById("userPasswordInput").value;
    const role = document.getElementById("userRoleInput").value;

    if (!username || !email || !password) {
        alert("Please fill username, email and password.");
        return;
    }

    try {
        await apiPost("/users", { username, email, password, role });
        document.getElementById("addUserForm").classList.add("hidden");
        await loadUsers();
    } catch (err) {
        alert("Could not add user. Check the backend / values entered.");
    }
}

async function deleteUser(userId) {
    if (!confirm("Delete this user? This will fail if they own tanks or feed events.")) return;
    try {
        await apiDelete(`/users/${userId}`);
        await loadUsers();
    } catch (err) {
        alert("Could not delete user — they may still own tanks or feed events.");
    }
}