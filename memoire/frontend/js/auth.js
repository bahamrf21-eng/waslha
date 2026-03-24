/**
 * Authentication Module
 * Handles user login, registration, and session management.
 * User data is stored in Supabase `profiles` table.
 * Session is kept in sessionStorage (currentUser) for page navigation.
 *
 * Closed B2B model – delivery accounts are predefined in Supabase.
 * Only merchants can self-register from the UI.
 */

const auth = {

    init: function () {
        const currentUser = this.getCurrentUser();

        if (
            currentUser &&
            (window.location.pathname.includes('login.html') ||
                window.location.pathname.includes('register.html'))
        ) {
            this.redirectToDashboard(currentUser.role);
        }

        if (
            !currentUser &&
            !window.location.pathname.includes('login.html') &&
            !window.location.pathname.includes('register.html')
        ) {
            window.location.replace('login.html');
            return;
        }

        if (currentUser) {
            history.replaceState(null, '', window.location.href);
            window.addEventListener('popstate', function () {
                if (!auth.getCurrentUser()) {
                    window.location.replace('login.html');
                }
            });
        }
    },

    login: async function (email, password) {
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return false;
        }

        const profile = await getProfileByEmail(email);

        if (profile && profile.password === password) {
            const sessionData = {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.role
            };
            if (profile.role === 'delivery') {
                sessionData.deliveryCompany = profile.delivery_company || '';
            }
            if (profile.role === 'merchant') {
                sessionData.phone = profile.phone || '';
                sessionData.address = profile.address || '';
                sessionData.preferredDelivery = profile.preferred_delivery || '';
            }

            sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
            this.redirectToDashboard(profile.role);
            return true;
        } else {
            this.showError('Invalid email or password');
            return false;
        }
    },

    // Closed B2B model – only merchant registration is allowed from the UI.
    register: async function (fullName, email, password, phone, preferredDelivery) {
        var role = 'merchant';

        if (!fullName || !email || !password || !phone || !preferredDelivery) {
            this.showError('Please fill in all fields');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }

        var phoneRegex = /^\+?[\d\s\-]{7,15}$/;
        if (!phoneRegex.test(phone)) {
            this.showError('Please enter a valid phone number');
            return false;
        }

        // Check if email already exists in Supabase
        const existing = await getProfileByEmail(email);
        if (existing) {
            this.showError('Email already registered');
            return false;
        }

        const newProfile = await createProfile({
            email: email,
            password: password,
            full_name: fullName,
            role: role,
            phone: phone,
            preferred_delivery: preferredDelivery
        });

        if (!newProfile) {
            this.showError('Registration failed. Please try again.');
            return false;
        }

        const sessionData = {
            id: newProfile.id,
            email: newProfile.email,
            fullName: newProfile.full_name,
            role: newProfile.role,
            phone: newProfile.phone || '',
            preferredDelivery: newProfile.preferred_delivery || ''
        };

        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
        this.redirectToDashboard(role);
        return true;
    },

    getCurrentUser: function () {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    logout: function () {
        sessionStorage.removeItem('currentUser');
        window.location.replace('login.html');
    },

    redirectToDashboard: function (role) {
        if (role === 'merchant') {
            window.location.replace('merchant-dashboard.html');
        } else if (role === 'delivery') {
            window.location.replace('delivery-dashboard.html');
        }
    },

    checkPageAccess: function (requiredRole) {
        const currentUser = this.getCurrentUser();

        if (!currentUser) {
            window.location.replace('login.html');
            return false;
        }

        if (requiredRole && currentUser.role !== requiredRole) {
            this.redirectToDashboard(currentUser.role);
            return false;
        }

        return true;
    },

    /**
     * Set up navbar links by role.
     * Merchant: Dashboard, Orders, Create Order, Profile, Logout.
     * Delivery: Dashboard, Profile, Logout (Orders and Create Order hidden).
     */
    initNavigation: function () {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        const dashboardLinks = document.querySelectorAll(
            '[id="dashboardLink"], .navbar-brand'
        );
        const ordersLinks = document.querySelectorAll('[id="ordersLink"]');
        const createOrderLinks = document.querySelectorAll('[id="createOrderLink"]');
        const backButtons = document.querySelectorAll('[id="backButton"]');

        if (currentUser.role === 'merchant') {
            dashboardLinks.forEach((link) => {
                link.href = 'merchant-dashboard.html';
            });
            ordersLinks.forEach((link) => {
                link.href = 'orders-list.html';
                link.style.display = '';
            });
            createOrderLinks.forEach((link) => {
                link.href = 'create-order.html';
                link.style.display = '';
            });
            backButtons.forEach((btn) => {
                btn.href = 'orders-list.html';
            });
        } else if (currentUser.role === 'delivery') {
            dashboardLinks.forEach((link) => {
                link.href = 'delivery-dashboard.html';
            });
            ordersLinks.forEach((link) => {
                link.style.display = 'none';
            });
            createOrderLinks.forEach((link) => {
                link.style.display = 'none';
            });
            backButtons.forEach((btn) => {
                btn.href = 'delivery-dashboard.html';
            });
            // Show Completed & Refused orders navbar links for delivery users
            var completedLinks = document.querySelectorAll('[id="completedOrdersLink"]');
            var refusedLinks = document.querySelectorAll('[id="refusedOrdersLink"]');
            completedLinks.forEach(function(link) { link.style.display = ''; });
            refusedLinks.forEach(function(link) { link.style.display = ''; });
        }
    },

    showError: function (message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;

        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(errorEl, form);
        } else {
            alert(message);
        }
    },

    showSuccess: function (message) {
        const existingMessage = document.querySelector(
            '.success-message, .error-message'
        );
        if (existingMessage) existingMessage.remove();

        const successEl = document.createElement('div');
        successEl.className = 'success-message';
        successEl.textContent = message;

        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(successEl, form);
        }
    }
};

// Login form
if (document.getElementById('loginForm')) {
    document
        .getElementById('loginForm')
        .addEventListener('submit', async function (e) {
            e.preventDefault();
            await auth.login(
                document.getElementById('email').value,
                document.getElementById('password').value
            );
        });
}

// Register form – Closed B2B model: only merchant accounts can be created
if (document.getElementById('registerForm')) {
    document
        .getElementById('registerForm')
        .addEventListener('submit', async function (e) {
            e.preventDefault();
            await auth.register(
                document.getElementById('fullName').value,
                document.getElementById('email').value,
                document.getElementById('password').value,
                document.getElementById('phone').value.trim(),
                document.getElementById('preferredDelivery').value
            );
        });
}

// Init
document.addEventListener('DOMContentLoaded', function () {
    auth.init();
    if (document.querySelector('.navbar')) {
        auth.initNavigation();
    }
});
