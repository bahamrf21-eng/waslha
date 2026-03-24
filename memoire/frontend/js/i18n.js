/**
 * Internationalization & Theme Module
 * ------------------------------------
 * - Dark / Light mode toggle (persisted in sessionStorage)
 * - English / Arabic language switch with RTL support
 * - Dynamic text replacement via data-i18n attributes
 * - Placeholder translation via data-i18n-placeholder
 *
 * Usage: include this script AFTER auth.js on every page,
 *        then call  platformUI.init()  on DOMContentLoaded.
 */

const platformUI = {

    /* ============================================
       Translations Dictionary
       ============================================ */
    translations: {
        // ---------- Navbar ----------
        'nav.brand':            { en: 'Waslha',                     ar: 'وصلها' },
        'nav.orders':           { en: 'Orders',                     ar: 'الطلبات' },
        'nav.createOrder':      { en: 'Create Order',               ar: 'إنشاء طلب' },
        'nav.profile':          { en: 'Profile',                    ar: 'الملف الشخصي' },
        'nav.logout':           { en: 'Logout',                     ar: 'تسجيل الخروج' },
        'nav.completed':        { en: 'Completed',                  ar: 'مكتملة' },
        'nav.refused':          { en: 'Refused',                    ar: 'مرفوضة' },

        // ---------- Login Page ----------
        'login.title':          { en: 'Welcome Back',               ar: 'مرحبًا بعودتك' },
        'login.subtitle':       { en: 'Sign in to your account',    ar: 'سجّل الدخول إلى حسابك' },
        'login.email':          { en: 'Email',                      ar: 'البريد الإلكتروني' },
        'login.password':       { en: 'Password',                   ar: 'كلمة المرور' },
        'login.submit':         { en: 'Login',                      ar: 'تسجيل الدخول' },
        'login.noAccount':      { en: "Don't have an account?",     ar: 'ليس لديك حساب؟' },
        'login.registerLink':   { en: 'Register here',              ar: 'سجّل هنا' },

        // ---------- Register Page ----------
        'register.title':       { en: 'Merchant Registration',      ar: 'تسجيل التاجر' },
        'register.subtitle':    { en: 'Create your merchant account to get started', ar: 'أنشئ حساب التاجر للبدء' },
        'register.fullName':    { en: 'Full Name',                  ar: 'الاسم الكامل' },
        'register.email':       { en: 'Email',                      ar: 'البريد الإلكتروني' },
        'register.password':    { en: 'Password',                   ar: 'كلمة المرور' },
        'register.phone':       { en: 'Phone Number',               ar: 'رقم الهاتف' },
        'register.delivery':    { en: 'Preferred Delivery Company', ar: 'شركة التوصيل المفضلة' },
        'register.selectDel':   { en: 'Select a delivery company',  ar: 'اختر شركة توصيل' },
        'register.submit':      { en: 'Register',                   ar: 'تسجيل' },
        'register.hasAccount':  { en: 'Already have an account?',   ar: 'لديك حساب بالفعل؟' },
        'register.loginLink':   { en: 'Login here',                 ar: 'سجّل الدخول هنا' },

        // ---------- Merchant Dashboard ----------
        'merchant.title':       { en: 'Merchant Dashboard',         ar: 'لوحة تحكم التاجر' },
        'merchant.subtitle':    { en: 'Overview of your delivery orders', ar: 'نظرة عامة على طلبات التوصيل' },
        'merchant.totalOrders': { en: 'Total Orders',               ar: 'إجمالي الطلبات' },
        'merchant.pending':     { en: 'Pending',                    ar: 'قيد الانتظار' },
        'merchant.delivered':   { en: 'Delivered',                  ar: 'تم التوصيل' },
        'merchant.returned':    { en: 'Returned',                   ar: 'مرتجعة' },
        'merchant.refused':     { en: 'Refused',                    ar: 'مرفوضة' },
        'merchant.refusedTitle': { en: 'Refused Orders',            ar: 'الطلبات المرفوضة' },
        'merchant.returnedTitle': { en: 'Returned Orders',          ar: 'الطلبات المرتجعة' },
        'merchant.createNew':   { en: 'Create New Order',           ar: 'إنشاء طلب جديد' },
        'merchant.recent':      { en: 'Recent Orders',              ar: 'الطلبات الأخيرة' },

        // ---------- Delivery Dashboard ----------
        'delivery.title':       { en: 'Delivery Company Dashboard', ar: 'لوحة تحكم شركة التوصيل' },
        'delivery.subtitle':    { en: 'Manage incoming delivery orders', ar: 'إدارة طلبات التوصيل الواردة' },
        'delivery.received':    { en: 'Orders Received',            ar: 'الطلبات المستلمة' },
        'delivery.inProgress':  { en: 'In Progress',                ar: 'قيد التنفيذ' },
        'delivery.completed':   { en: 'Completed',                  ar: 'مكتملة' },
        'delivery.refused':     { en: 'Refused',                    ar: 'مرفوضة' },
        'delivery.searchTitle': { en: 'Search Orders by Phone',     ar: 'البحث عن الطلبات بالهاتف' },
        'delivery.searchBtn':   { en: 'Search',                     ar: 'بحث' },
        'delivery.available':   { en: 'Available Orders',           ar: 'الطلبات المتاحة' },
        'delivery.inProgressTitle': { en: 'Orders In Progress',     ar: 'الطلبات قيد التنفيذ' },
        'delivery.completedTitle':  { en: 'Completed Orders',       ar: 'الطلبات المكتملة' },
        'delivery.refusedTitle':    { en: 'Refused Orders',         ar: 'الطلبات المرفوضة' },
        'delivery.returned':    { en: 'Returned',                   ar: 'مرتجعة' },
        'delivery.returnedTitle': { en: 'Returned Orders',          ar: 'الطلبات المرتجعة' },

        // ---------- Create Order ----------
        'create.title':         { en: 'Create New Order',           ar: 'إنشاء طلب جديد' },
        'create.subtitle':      { en: 'Fill in the details to create a delivery order', ar: 'املأ التفاصيل لإنشاء طلب توصيل' },
        'create.firstName':     { en: 'Customer First Name',        ar: 'اسم الزبون' },
        'create.lastName':      { en: 'Customer Last Name',         ar: 'لقب الزبون' },
        'create.customerAddress': { en: 'Customer Address',          ar: 'عنوان الزبون' },
        'create.product':       { en: 'Product Name',               ar: 'اسم المنتج' },
        'create.delivery':      { en: 'Delivery Company',           ar: 'شركة التوصيل' },
        'create.selectDel':     { en: 'Select a delivery company',  ar: 'اختر شركة توصيل' },
        'create.wilaya':        { en: 'Wilaya',                     ar: 'الولاية' },
        'create.selectWilaya':  { en: 'Select Wilaya',              ar: 'اختر الولاية' },
        'create.phone':         { en: 'Customer Phone Number',      ar: 'رقم هاتف الزبون' },
        'create.weight':        { en: 'Weight (kg)',                ar: 'الوزن (كغ)' },
        'create.deliveryType':  { en: 'Delivery Type',              ar: 'نوع التوصيل' },
        'create.selectDelType': { en: 'Select delivery type',       ar: 'اختر نوع التوصيل' },
        'create.domicile':      { en: 'Domicile',                   ar: 'إلى المنزل' },
        'create.bureau':        { en: 'Bureau',                     ar: 'إلى المكتب' },
        'create.notes':         { en: 'Notes (Optional)',           ar: 'ملاحظات (اختياري)' },
        'create.submit':        { en: 'Submit Order',               ar: 'إرسال الطلب' },
        'create.cancel':        { en: 'Cancel',                     ar: 'إلغاء' },
        'create.illustCaption': { en: 'Fast & reliable delivery management', ar: 'إدارة توصيل سريعة وموثوقة' },
        'create.recommendedCompany': { en: 'Recommended based on your profile', ar: 'مقترحة بناءً على ملفك الشخصي' },

        // ---------- Orders List ----------
        'ordersList.title':     { en: 'My Orders',                  ar: 'طلباتي' },
        'ordersList.subtitle':  { en: 'View and manage all your delivery orders', ar: 'عرض وإدارة جميع طلبات التوصيل' },
        'ordersList.searchTitle': { en: 'Search Orders by Phone',   ar: 'البحث عن الطلبات بالهاتف' },
        'ordersList.searchBtn': { en: 'Search',                     ar: 'بحث' },
        'ordersList.id':        { en: 'Order ID',                   ar: 'رقم الطلب' },
        'ordersList.customer':  { en: 'Customer',                   ar: 'الزبون' },
        'ordersList.product':   { en: 'Product',                    ar: 'المنتج' },
        'ordersList.wilaya':    { en: 'Wilaya',                     ar: 'الولاية' },
        'ordersList.weight':    { en: 'Weight (kg)',                ar: 'الوزن (كغ)' },
        'ordersList.deliveryType': { en: 'Delivery Type',           ar: 'نوع التوصيل' },
        'ordersList.status':    { en: 'Status',                     ar: 'الحالة' },
        'ordersList.actions':   { en: 'Actions',                    ar: 'الإجراءات' },

        // ---------- Order Details ----------
        'details.title':        { en: 'Order Details',              ar: 'تفاصيل الطلب' },
        'details.back':         { en: 'Back to Orders',             ar: 'العودة إلى الطلبات' },
        'details.info':         { en: 'Order Information',          ar: 'معلومات الطلب' },
        'details.firstName':    { en: 'Customer First Name',        ar: 'اسم الزبون' },
        'details.lastName':     { en: 'Customer Last Name',         ar: 'لقب الزبون' },
        'details.customerAddress': { en: 'Customer Address',         ar: 'عنوان الزبون' },
        'details.product':      { en: 'Product Name',               ar: 'اسم المنتج' },
        'details.wilaya':       { en: 'Wilaya',                     ar: 'الولاية' },
        'details.weight':       { en: 'Weight',                     ar: 'الوزن' },
        'details.status':       { en: 'Status',                     ar: 'الحالة' },
        'details.phone':        { en: 'Customer Phone',             ar: 'هاتف الزبون' },
        'details.delivery':     { en: 'Delivery Company',           ar: 'شركة التوصيل' },
        'details.deliveryType': { en: 'Delivery Type',              ar: 'نوع التوصيل' },
        'details.notes':        { en: 'Notes',                      ar: 'ملاحظات' },
        'details.timeline':     { en: 'Order Timeline',             ar: 'الجدول الزمني للطلب' },

        // ---------- Profile ----------
        'profile.title':        { en: 'Profile & Settings',         ar: 'الملف الشخصي والإعدادات' },
        'profile.subtitle':     { en: 'Manage your account information', ar: 'إدارة معلومات حسابك' },
        'profile.info':         { en: 'Account Information',        ar: 'معلومات الحساب' },
        'profile.name':         { en: 'Full Name',                  ar: 'الاسم الكامل' },
        'profile.email':        { en: 'Email',                      ar: 'البريد الإلكتروني' },
        'profile.password':     { en: 'New Password',               ar: 'كلمة المرور الجديدة' },
        'profile.role':         { en: 'Role',                       ar: 'الدور' },
        'profile.phone':        { en: 'Phone',                      ar: 'الهاتف' },
        'profile.address':      { en: 'Address',                    ar: 'العنوان' },
        'profile.company':      { en: 'Delivery Company',           ar: 'شركة التوصيل' },
        'profile.editTitle':    { en: 'Edit Profile',               ar: 'تعديل الملف الشخصي' },
        'profile.editBtn':      { en: 'Edit Profile',               ar: 'تعديل الملف الشخصي' },
        'profile.saveBtn':      { en: 'Save Changes',               ar: 'حفظ التغييرات' },
        'profile.cancelBtn':    { en: 'Cancel',                     ar: 'إلغاء' },
        'profile.logout':       { en: 'Logout',                     ar: 'تسجيل الخروج' },

        // ---------- Completed / Refused Pages ----------
        'completed.title':      { en: 'Completed Orders',           ar: 'الطلبات المكتملة' },
        'completed.subtitle':   { en: 'Orders successfully delivered', ar: 'الطلبات التي تم توصيلها بنجاح' },
        'completed.cardTitle':  { en: 'Delivered Orders',           ar: 'الطلبات الموصلة' },
        'refused.title':        { en: 'Refused Orders',             ar: 'الطلبات المرفوضة' },
        'refused.subtitle':     { en: 'Orders that were declined',  ar: 'الطلبات التي تم رفضها' },
        'refused.cardTitle':    { en: 'Refused Orders',             ar: 'الطلبات المرفوضة' },

        // ---------- Hero / Landing ----------
        'hero.login':           { en: 'Login',                      ar: 'تسجيل الدخول' },
        'hero.getStarted':      { en: 'Get Started',                ar: 'ابدأ الآن' },
        'hero.badge':           { en: '◈ B2B Delivery Platform',    ar: '◈ منصة توصيل B2B' },
        'hero.title1':          { en: 'Smart Delivery Management',  ar: 'إدارة توصيل ذكية' },
        'hero.title2':          { en: 'for',                        ar: 'لـ' },
        'hero.ecommerce':       { en: 'E-commerce',                 ar: 'التجارة الإلكترونية' },
        'hero.logistics':       { en: 'Logistics',                  ar: 'اللوجستيات' },
        'hero.subtitle':        { en: 'Waslha connects merchants with delivery companies through a simple and organized digital workflow — track, manage, and deliver with confidence.', ar: 'وصلها تربط التجار مع شركات التوصيل من خلال سيرعمل رقمي بسيط ومنظم — تتبّع، أدر، ووصّل بثقة.' },
        'hero.startNow':        { en: 'Start Now →',                ar: 'ابدأ الآن ←' },
        'hero.feat1Title':      { en: 'Order Management',           ar: 'إدارة الطلبات' },
        'hero.feat1Desc':       { en: 'Merchants create, edit, and track orders in real time with a clean, intuitive dashboard.', ar: 'ينشئ التجار الطلبات ويعدلونها ويتتبعونها في الوقت الفعلي عبر لوحة تحكم بسيطة.' },
        'hero.feat2Title':      { en: 'Delivery Workflow',          ar: 'سيرعمل التوصيل' },
        'hero.feat2Desc':       { en: 'Delivery companies accept, process, and mark orders as delivered through a structured status lifecycle.', ar: 'تقبل شركات التوصيل الطلبات وتعالجها وتُعلّمها كمُوصّلة عبر دورة حالات منظمة.' },
        'hero.feat3Title':      { en: 'Live Dashboards',            ar: 'لوحات تحكم مباشرة' },
        'hero.feat3Desc':       { en: 'Both roles get synchronized counters and lists that update instantly across all sessions.', ar: 'يحصل كلا الدورين على عدادات وقوائم مُتزامنة تُحدَّث فوريًا عبر جميع الجلسات.' },
        'hero.footer':          { en: '© 2026 Waslha — Academic Project · All rights reserved.', ar: '© 2026 وصلها — مشروع أكاديمي · جميع الحقوق محفوظة.' },

        // ---------- UI Components ----------
        'ui.back':              { en: 'Back',                        ar: 'رجوع' },

        // ---------- Placeholders ----------
        'ph.email':             { en: 'your.email@example.com',     ar: 'بريدك@مثال.com' },
        'ph.password':          { en: 'Enter your password',        ar: 'أدخل كلمة المرور' },
        'ph.createPassword':    { en: 'Create a password (min. 6 characters)', ar: 'أنشئ كلمة مرور (6 أحرف على الأقل)' },
        'ph.fullName':          { en: 'John Doe',                   ar: 'محمد أحمد' },
        'ph.phone':             { en: '0555 123 456',               ar: '0555 123 456' },
        'ph.product':           { en: 'e.g., Electronics Package',  ar: 'مثال: طرد إلكتروني' },
        'ph.weight':            { en: 'e.g., 2.5',                  ar: 'مثال: 2.5' },
        'ph.notes':             { en: 'Additional instructions or notes about the delivery...', ar: 'تعليمات إضافية أو ملاحظات حول التوصيل...' },
        'ph.customerPhone':     { en: 'e.g., 0555123456',           ar: 'مثال: 0555123456' },
        'ph.firstName':         { en: 'e.g., Ahmed',                ar: 'مثال: أحمد' },
        'ph.lastName':          { en: 'e.g., Benali',               ar: 'مثال: بن علي' },
        'ph.customerAddress':   { en: 'e.g., 12 Rue Didouche Mourad, Algiers', ar: 'مثال: 12 شارع ديدوش مراد، الجزائر' },
        'ph.phoneSearch':       { en: 'Enter customer phone number', ar: 'أدخل رقم هاتف الزبون' },
        'ph.merchantPhoneSearch': { en: 'Enter customer phone number', ar: 'أدخل رقم هاتف الزبون' },


        // ---------- Status Labels (for dynamic badge translation) ----------
        'status.pending':       { en: 'Pending',                    ar: 'قيد الانتظار' },
        'status.in_progress':   { en: 'In Progress',                ar: 'قيد التنفيذ' },
        'status.delivered':     { en: 'Delivered',                  ar: 'تم التوصيل' },
        'status.refused':       { en: 'Refused',                    ar: 'مرفوض' },
        'status.returned':      { en: 'Returned',                   ar: 'مرتجع' },
        'status.cancelled':     { en: 'Cancelled',                  ar: 'ملغى' }
    },

    /* ============================================
       Initialisation
       ============================================ */
    init: function () {
        this.applyTheme();
        this.applyLanguage();
    },

    /* ============================================
       DARK / LIGHT MODE
       ============================================ */
    getTheme: function () {
        return sessionStorage.getItem('platformTheme') || 'light';
    },

    setTheme: function (theme) {
        sessionStorage.setItem('platformTheme', theme);
        this.applyTheme();
    },

    applyTheme: function () {
        var theme = this.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
        // Update all toggle button labels
        var btns = document.querySelectorAll('.theme-toggle');
        btns.forEach(function (btn) {
            btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
        });
    },

    toggleTheme: function () {
        var current = this.getTheme();
        this.setTheme(current === 'dark' ? 'light' : 'dark');
    },

    /* ============================================
       LANGUAGE (EN / AR)
       ============================================ */
    getLang: function () {
        return sessionStorage.getItem('platformLang') || 'en';
    },

    setLang: function (lang) {
        sessionStorage.setItem('platformLang', lang);
        this.applyLanguage();
    },

    toggleLang: function () {
        var current = this.getLang();
        this.setLang(current === 'en' ? 'ar' : 'en');
    },

    applyLanguage: function () {
        var lang = this.getLang();

        // Set direction
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Replace text via data-i18n attributes
        var elements = document.querySelectorAll('[data-i18n]');
        var self = this;
        elements.forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var entry = self.translations[key];
            if (entry) {
                el.textContent = entry[lang] || entry.en;
            }
        });

        // Replace placeholders via data-i18n-placeholder
        var phElements = document.querySelectorAll('[data-i18n-placeholder]');
        phElements.forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            var entry = self.translations[key];
            if (entry) {
                el.placeholder = entry[lang] || entry.en;
            }
        });

        // Update language toggle buttons
        var langBtns = document.querySelectorAll('.lang-toggle');
        langBtns.forEach(function (btn) {
            btn.textContent = lang === 'en' ? 'AR عربي' : 'EN English';
        });
    },

    /* ============================================
       Helper — translate a single key (for JS use)
       ============================================ */
    t: function (key) {
        var lang = this.getLang();
        var entry = this.translations[key];
        if (entry) return entry[lang] || entry.en;
        return key;
    },

    /* ============================================
       Smart Back Button
       ============================================
       Renders a back button that uses history.back() when there is
       browser history, otherwise falls back to the role-based dashboard.
       Call: platformUI.renderBackButton(containerSelector)
    */
    renderBackButton: function (containerSelector) {
        var container = document.querySelector(containerSelector);
        if (!container) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-back';
        btn.innerHTML = '<span class="back-arrow">\u2190</span> <span data-i18n="ui.back">' + this.t('ui.back') + '</span>';

        btn.addEventListener('click', function () {
            // If there is meaningful history, go back; otherwise go to dashboard
            if (window.history.length > 1 && document.referrer) {
                window.history.back();
            } else {
                // Fallback to role-based dashboard
                var user = (typeof auth !== 'undefined') ? auth.getCurrentUser() : null;
                if (user && user.role === 'delivery') {
                    window.location.href = 'delivery-dashboard.html';
                } else {
                    window.location.href = 'merchant-dashboard.html';
                }
            }
        });

        container.insertBefore(btn, container.firstChild);
    }
};
