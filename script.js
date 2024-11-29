function showMessage(element, message, color) {
    element.style.color = color;
    element.textContent = message;
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

function checkLogin() {
    if (!sessionStorage.getItem('loggedInUser')) {
        window.location.replace('login.html');
    }
}

const backendUrl = '';

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const registerMessage = document.getElementById('registerMessage');

    if (username.length < 3 || password.length < 6) {
        showMessage(registerMessage, 'Kullanıcı adı en az 3, şifre en az 6 karakter olmalıdır.', 'red');
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(registerMessage, data.message, 'green');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(registerMessage, data.message, 'red');
        }
    } catch (error) {
        showMessage(registerMessage, 'Sunucu hatası.', 'red');
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginMessage = document.getElementById('loginMessage');

    try {
        const response = await fetch(`${backendUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            sessionStorage.setItem('loggedInUser', username);
            showMessage(loginMessage, data.message, 'green');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(loginMessage, data.message, 'red');
        }
    } catch (error) {
        showMessage(loginMessage, 'Sunucu hatası.', 'red');
    }
}

async function updateUser(event) {
    event.preventDefault();
    const password = document.getElementById('updatePassword').value;
    const updateUserMessage = document.getElementById('updateUserMessage');
    const username = sessionStorage.getItem('loggedInUser');

    if (!username) {
        showMessage(updateUserMessage, 'Oturum açılmadı.', 'red');
        return;
    }

    if (password.length < 6) {
        showMessage(updateUserMessage, 'Şifre en az 6 karakter olmalıdır.', 'red');
        return;
    }

    try {
        const response = await fetch(`/users/${encodeURIComponent(username)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(updateUserMessage, data.message, 'green');
            document.getElementById('updateUserForm').reset();
        } else {
            showMessage(updateUserMessage, data.message, 'red');
        }
    } catch (error) {
        showMessage(updateUserMessage, 'Sunucu hatası.', 'red');
    }
}

async function deleteUser(event) {
    event.preventDefault();
    const deleteUserMessage = document.getElementById('deleteUserMessage');
    const username = sessionStorage.getItem('loggedInUser');

    if (!username) {
        showMessage(deleteUserMessage, 'Oturum açılmadı.', 'red');
        return;
    }

    try {
        const response = await fetch(`/users/${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(deleteUserMessage, data.message, 'green');
            sessionStorage.removeItem('loggedInUser');
            setTimeout(() => {
                window.location.href = 'register.html';
            }, 2000);
        } else {
            showMessage(deleteUserMessage, data.message, 'red');
        }
    } catch (error) {
        showMessage(deleteUserMessage, 'Sunucu hatası.', 'red');
    }
}

function setupEventListeners() {
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }

    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            register();
        });
    }

    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (document.getElementById('logoutButton')) {
        if (loggedInUser) {
            document.getElementById('logoutButton').style.display = 'inline-block';
            document.getElementById('logoutButton').addEventListener('click', logout);
        } else {
            document.getElementById('logoutButton').style.display = 'none';
        }
    }

    if (document.getElementById('accountLink')) {
        if (loggedInUser) {
            document.getElementById('accountLink').style.display = 'block';
        } else {
            document.getElementById('accountLink').style.display = 'none';
        }
    }

    if (window.location.pathname.endsWith('account.html')) {
        checkLogin();
        document.getElementById('updateUserForm').addEventListener('submit', updateUser);
        document.getElementById('deleteUserButton').addEventListener('click', deleteUser);
    }

    if (window.location.pathname.endsWith('index.html') || window.location.pathname.includes('article')) {
        checkLogin();
    }
}

document.addEventListener('DOMContentLoaded', setupEventListeners);
