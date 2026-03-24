# Waslha — Deployment Structure & Best Practices Guide

## ✅ Restructuring Complete!

Your project has been successfully restructured for clean, production-ready deployment on **Vercel** and **GitHub Pages**.

---

## 📁 Final Directory Structure

```
memoire/
├── frontend/                          # Main deployment root
│   ├── *.html files (12 total)      # All HTML files at root level
│   │   ├── index.html               # Entry point (redirect)
│   │   ├── hero.html                # Public landing page
│   │   ├── login.html               # Authentication
│   │   ├── register.html            # User registration
│   │   ├── merchant-dashboard.html  # Merchant view
│   │   ├── delivery-dashboard.html  # Delivery company view
│   │   ├── create-order.html        # Order creation
│   │   ├── orders-list.html         # Merchant orders
│   │   ├── order-details.html       # Order info modal
│   │   ├── completed-orders.html    # Delivery completed
│   │   ├── refused-orders.html      # Declined orders
│   │   └── profile.html             # User profile
│   ├── css/                          # Stylesheets
│   │   ├── global.css              # Global styles
│   │   └── hero.css                 # Hero page styles
│   ├── js/                           # JavaScript modules
│   │   ├── auth.js                 # Authentication logic
│   │   ├── db.js                   # Database queries
│   │   ├── dashboard.js            # Dashboard functionality
│   │   ├── i18n.js                 # Internationalization
│   │   └── orders.js               # Order management
│   └── supabase/                     # Supabase integration
│       └── supabaseClient.js        # Supabase client config
└── backend/                          # (Separate - not deployed)
    └── schema.sql                   # Database schema
```

---

## 🔗 Corrected Path Examples

### ✅ BEFORE (❌ Incorrect)
```html
<!-- ❌ These paths would cause 404 errors -->
<link rel="stylesheet" href="../css/global.css">
<script src="../js/auth.js"></script>
<script src="../supabase/supabaseClient.js"></script>
```

### ✅ AFTER (✅ Correct)
```html
<!-- ✅ These paths work on Vercel & GitHub Pages -->
<link rel="stylesheet" href="css/global.css">
<script src="js/auth.js"></script>
<script src="supabase/supabaseClient.js"></script>
```

---

## 📝 Example: Corrected index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waslha — Delivery Management Platform</title>
    
    <!-- ✅ CORRECT: Relative paths without ../ prefix -->
    <link rel="stylesheet" href="css/global.css">
    
    <!-- Redirect meta tag (serves as entry point) -->
    <meta http-equiv="refresh" content="0; url=hero.html">
</head>
<body>
    <p>Redirecting to <a href="hero.html">home page</a>...</p>
</body>
</html>
```

---

## 📝 Example: Corrected hero.html (Head Section)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waslha — Smart Delivery Management Platform</title>
    
    <!-- ✅ CORRECT: Direct relative paths -->
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/hero.css">
</head>
<body>
    <!-- Page content -->
    
    <!-- ✅ CORRECT: Scripts load from js/ folder -->
    <script src="js/i18n.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            platformUI.init();
        });
    </script>
</body>
</html>
```

---

## 📝 Example: Corrected dashboard.html (Scripts Section)

```html
    <!-- Bottom of file, before closing </body> -->
    
    <!-- External CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- ✅ CORRECT: All local paths without ../ prefix -->
    <script src="supabase/supabaseClient.js"></script>
    <script src="js/db.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/orders.js"></script>
    <script src="js/dashboard.js"></script>
    <script src="js/i18n.js"></script>
    
    <!-- Initialization script -->
    <script>
        document.addEventListener('DOMContentLoaded', async function () {
            if (!auth.checkPageAccess('merchant')) return;
            auth.initNavigation();
            platformUI.init();
            await dashboard.init('merchant');
        });
    </script>
</body>
</html>
```

---

## 🚀 Deployment Instructions

### For Vercel:

1. **Connect your GitHub/GitLab repo** to Vercel
2. **Set build settings:**
   - Framework: None (Static HTML)
   - Root Directory: `memoire/frontend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

3. **Deploy** — Vercel will serve all files from `frontend/` as static assets

### For GitHub Pages:

1. **Enable GitHub Pages** in your repository settings
2. **Set publishing source** to the branch and `memoire/frontend` folder
3. **Push your commits** — GitHub will automatically build and deploy

### For Self-Hosted (Nginx/Apache):

```nginx
# nginx.conf example
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve all files from frontend directory
    root /var/www/waslha/memoire/frontend;
    
    # Fallback for SPA (optional, if needed)
    try_files $uri $uri/ /index.html;
}
```

---

## ✅ Path Correction Summary

All 12 HTML files have been updated:

| File | CSS Paths | JS/Supabase Paths | Status |
|------|-----------|-------------------|--------|
| index.html | ✅ Fixed | N/A | ✅ Ready |
| hero.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| login.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| register.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| merchant-dashboard.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| delivery-dashboard.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| create-order.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| orders-list.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| order-details.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| completed-orders.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| refused-orders.html | ✅ Fixed | ✅ Fixed | ✅ Ready |
| profile.html | ✅ Fixed | ✅ Fixed | ✅ Ready |

---

## 🛡️ Best Practices for Production Deployment

### 1. **Always Use Relative Paths (Without ../)** ✅

```html
<!-- ✅ Good - Works on all platforms -->
<link rel="stylesheet" href="css/style.css">
<script src="js/app.js"></script>

<!-- ❌ Bad - May fail on different deployment roots -->
<link rel="stylesheet" href="../css/style.css">
<script src="../../js/app.js"></script>

<!-- ❌ Bad - Breaks on relative domains -->
<link rel="stylesheet" href="/css/style.css">
<script src="/js/app.js"></script>
```

### 2. **File Organization**
- Keep all HTML in the project root
- Maintain separate `css/`, `js/`, `images/`, `fonts/` folders
- Group related assets logically

### 3. **Avoid Common 404 Errors**
```html
<!-- ❌ Problem: ./ prefix is unnecessary -->
<script src="./js/app.js"></script>

<!-- ❌ Problem: Absolute paths break on subdomains -->
<link rel="stylesheet" href="/css/style.css">

<!-- ✅ Solution: Simple relative paths -->
<script src="js/app.js"></script>
<link rel="stylesheet" href="css/style.css">
```

### 4. **For SPA/Dynamic Content**
If you need client-side routing, ensure your server fallback is configured:

**Vercel** (automatic for SPA):
- Vercel automatically redirects 404s to index.html

**GitHub Pages** (requires _redirects or .htaccess):
```
/* /index.html 200
```

**Nginx**:
```nginx
try_files $uri $uri/ /index.html;
```

### 5. **Local Testing**
Before deployment, test locally:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server . -p 8000

# Then visit: http://localhost:8000
```

### 6. **Asset Integrity Checklist**
- [ ] No `../` relative paths in any HTML file
- [ ] All CSS files in `css/` folder
- [ ] All JS files in `js/` folder
- [ ] All images properly referenced
- [ ] External CDNs (Supabase, etc.) using HTTPS
- [ ] No console errors when loading pages
- [ ] All navigation links working correctly

---

## 🔍 Verification Checklist

Run this to verify your project is ready:

```bash
# Check for any remaining incorrect paths
grep -r "../css/" memoire/frontend/
grep -r "../js/" memoire/frontend/
grep -r "../supabase/" memoire/frontend/

# If no output appears, you're all set! ✅
```

---

## 📋 What Was Changed

### Removed:
- ❌ Empty `html/` subfolder (not needed)
- ❌ All `../` relative path prefixes from HTML files

### Updated:
- ✅ All 12 HTML files with correct relative paths
- ✅ CSS references: `../css/` → `css/`
- ✅ JS references: `../js/` → `js/`
- ✅ Supabase references: `../supabase/` → `supabase/`

### Maintained:
- ✅ All CSS files (global.css, hero.css)
- ✅ All JS files (auth.js, db.js, orders.js, dashboard.js, i18n.js)
- ✅ Supabase integration (supabaseClient.js)
- ✅ HTML content and functionality

---

## 🎯 You're Ready to Deploy! 🚀

Your project is now:
- ✅ **Clean** - Organized folder structure
- ✅ **Production-Ready** - All paths corrected
- ✅ **Portable** - Works on Vercel, GitHub Pages, or any static host
- ✅ **Maintainable** - Simple relative paths, easy to understand

Simply deploy the `memoire/frontend` folder and you're done!

---

## 📞 Troubleshooting

### Issue: "404 Not Found" on assets
**Solution:** Check that paths don't have `../` prefix. Use relative paths like `css/style.css`

### Issue: Assets work locally but not on production
**Solution:** Ensure your server root is set to the `frontend/` folder, not `memoire/`

### Issue: Navigation links return 404
**Solution:** All links should be simple file names like `login.html` (not `/login.html` or `../login.html`)

### Issue: Supabase client not loading
**Solution:** Verify path is `supabase/supabaseClient.js` and file exists in that location

---

**Last Updated:** March 2026  
**Status:** ✅ Production Ready
