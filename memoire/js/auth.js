
const auth = {

    init: async function () {
        const user = await this.getCurrentUser();

        if (
            user &&
            (window.location.pathname.includes('login.html') ||
             window.location.pathname.includes('register.html'))
        ) {
            this.redirectToDashboard(user.role);
        }

        if (
            !user &&
            !window.location.pathname.includes('login.html') &&
            !window.location.pathname.includes('register.html')
        ) {
            window.location.replace('login.html');
            return;
        }
    },

    // ✅ LOGIN WITH SUPABASE AUTH
    login: async function (email, password) {
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return false;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            this.showError('Invalid email or password');
            return false;
        }

        const user = data.user;

        // جيب profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            this.showError('Profile not found');
            return false;
        }

        sessionStorage.setItem('currentUser', JSON.stringify(profile));
        this.redirectToDashboard(profile.role);
        return true;
    },

    // ✅ REGISTER WITH AUTH
    register: async function (fullName, email, password, phone, preferredDelivery) {

        if (!fullName || !email || !password || !phone || !preferredDelivery) {
            this.showError('Please fill in all fields');
            return false;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return false;
        }

        // 1. create auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            this.showError(error.message);
            return false;
        }

        const user = data.user;

        // 2. create profile
        const { error: insertError } = await supabase.from("profiles").insert({
            user_id: user.id,
            email: email,
            full_name: fullName,
            role: "merchant",
            phone: phone,
            preferred_delivery: preferredDelivery
        });

        if (insertError) {
            this.showError('Error creating profile');
            return false;
        }

        // auto login
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: email,
            full_name: fullName,
            role: "merchant"
        }));

        this.redirectToDashboard("merchant");
        return true;
    },

    // ✅ GET CURRENT USER
    getCurrentUser: async function () {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        return profile;
    },

    logout: async function () {
        await supabase.auth.signOut();
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

    showError: function (message) {
        alert(message);
    }
};


// LOGIN FORM
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm')
        .addEventListener('submit', async function (e) {
            e.preventDefault();
            await auth.login(
                document.getElementById('email').value,
                document.getElementById('password').value
            );
        });
}


// REGISTER FORM
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm')
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


// INIT
document.addEventListener('DOMContentLoaded', function () {
    auth.init();
});
