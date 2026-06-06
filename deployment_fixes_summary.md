# WebBuilders Portal - Deployment & Troubleshooting Reference Guide

This document contains a comprehensive summary of all diagnostics, fixes, and architectural adjustments made during this session. It serves as your permanent reference for local development and cPanel deployment.

---

## 1. Local Filesystem Path to Raw Conversation Logs
The system automatically records the absolute raw transcript (including code snippets, terminal commands, and chat logs) of this entire conversation directly on your computer:
* 📂 **Path:** `C:\Users\bharath\.gemini\antigravity\brain\11b18ab0-f04d-4da0-ad00-2113016feb5b\.system_generated\logs\overview.txt`

---

## 2. Step-by-Step Guide: How to Upload & Deploy Laravel Backend to cPanel
Follow these detailed steps to upload and update your Laravel backend files on cPanel from the very beginning:

### Step A: Prepare the Backend Locally (On your PC)
1. Navigate to your local project directory: `D:\xampp\htdocs\New folder\New folder (2)\webbuilders_full_structure_fixed\`.
2. Locate the **`laravel-backend`** folder.
3. **Zip the folder:** Create a zip file of this folder (e.g., `laravel-backend.zip`).
   * ⚠️ **Crucial Warning:** Before zipping, make sure you **exclude** or delete the following files to prevent server crashes:
     - Exclude the local **`.env`** file (to avoid overwriting the production database credentials in cPanel).
     - Exclude the files inside **`bootstrap/cache/`** (specifically `config.php`, `services.php`, and `packages.php` because they contain Windows absolute paths that will crash the server).

### Step B: Upload and Extract in cPanel File Manager
1. Log in to your **cPanel Dashboard**.
2. Open **File Manager** and navigate into the **`public_html/`** folder.
3. Click the **Upload** button at the top menu and select your `laravel-backend.zip` file.
4. Once the upload is 100% complete (the bar turns green), return to `public_html/`.
5. Right-click the uploaded `laravel-backend.zip` and click **Extract**.
6. Ensure the extracted folder is named exactly **`backend`** (so its path is `/public_html/backend`).

### Step C: Standardize Folder & File Permissions (To Avoid 503 suPHP blocks)
After extracting, set these permissions immediately. In cPanel File Manager, right-click the folders/files and select **Change Permissions**:

1. **Root Backend Directory:**
   - Folder `/public_html/backend` ➔ Must be **`0755`**
2. **Main Root Folders inside `/public_html/backend/`:**
   - `app`, `config`, `database`, `resources`, `routes`, `vendor` ➔ Must be **`0755`**
3. **Main Root Files inside `/public_html/backend/`:**
   - `artisan`, `composer.json`, `composer.lock` ➔ Must be **`0644`**
4. **Public Directory Files inside `/public_html/backend/public/`:**
   - Navigate into `/public_html/backend/public/`.
   - Set these folders to **`0755`**: `css`, `js`, `.well-known`.
   - Set these files to **`0644`**: `.htaccess`, `index.php`, `clear_cache.php`, `test.php`, `fix_database.php`.

### Step D: Clear Server Bootstrap Caches
1. Go to `/public_html/backend/bootstrap/cache/` inside cPanel.
2. Delete any `.php` files (like `config.php`, `services.php`, `packages.php`) if they were uploaded by accident. Only leave `.gitignore` or keep the folder empty.

### Step E: Execute Artisans via Web Browser
Since terminal is disabled, trigger the migrations and clear cache via the browser:
1. Open your browser and visit:
   👉 **`https://api.clientportal.webbuilders.lk/clear_cache.php`** (to clean up caches and prepare the app).
2. Visit:
   👉 **`https://api.clientportal.webbuilders.lk/fix_database.php`** (to run database schema fixes, if any).

---

## 3. Issues Solved & Actions Taken (Summary)

### 🛡️ Shared Hosting Permission Rules & suPHP/LiteSpeed Blocks
* Standardized folder permissions inside `/backend` to **`0755`** and files to **`0644`** to prevent mod_security/suPHP blocks.

### 🚀 Bypassed Outside-public_html PHP Execution Block
* Moved the `backend` folder completely inside `public_html` (located at `/home/clientswebbuilde/public_html/backend`) and pointed the subdomain root to `/home/clientswebbuilde/public_html/backend/public` to bypass shared hosting PHP blocks.

### ⚡ CORS Configuration Updated
* Modified `laravel-backend/config/cors.php` to include both local and production frontend origins:
  ```php
  'allowed_origins' => [
      'http://localhost:3000',
      'https://clientportal.webbuilders.lk',
      'http://clientportal.webbuilders.lk'
  ],
  ```

### 🎯 JavaScript Type Coercion Bug Fixed (Agent Hub Commission Pool)
* Updated `nextjs-frontend/app/(dashboard)/admin/agents/page.tsx` (Line 61) to cast values to `Number` before summing:
  ```typescript
  const totalCommissionPool = agents.reduce((acc, a) => acc + Number(a.earned_commissions || 0) + Number(a.pending_commissions || 0), 0);
  ```

### 💻 Localhost Environment Isolated
* Updated local `nextjs-frontend/.env.local` to point to the local backend `http://localhost:8000/api` to enable local development and avoid production lockout blocks.

---

## 4. Server-Level Lockouts & Troubleshooting Hacks

### 🔴 The `lve_suwrapper: Unable to fork` 503 Lockout
* **Diagnosis:** CloudLinux limits concurrent entry processes (101 times exceeded), blocking all PHP/Node.js requests at the kernel level.
* **The MultiPHP Manager Reset Hack (No Support Required):**
  - Go to cPanel ➔ **MultiPHP Manager**.
  - Temporarily switch your domain PHP version (e.g., from `PHP 8.2` to `PHP 8.1`) and click **Apply**.
  - Wait 10 seconds, switch it back to **`PHP 8.2`**, and click **Apply**.
  - *Why it works:* Toggling the version kills all active PHP-FPM worker pools for your user, releasing the locked resources immediately!
* **The 30-Minute Cooldown Hack:**
  - Close all browser tabs pointing to the site and leave it alone for 30 minutes without refreshing.

### 📞 Hosting Support Request Template
If the lockout remains active, open a Live Chat or Support Ticket with your hosting provider and copy-paste this message:
> *"Hello, my account has hit the entry processes limit (LVE limits), and I am getting a persistent **`lve_suwrapper: Unable to fork`** error on all PHP files on my website. Could you please kill all hanging concurrent processes and reset the LVE resource limits for my cPanel user account?"*

---

## 5. Final Deployment Steps (After Local Work is Completed)

Once you are done with all local corrections and want to publish the updates:

### Step 1: Build & Deploy Next.js Frontend
1. Open your local terminal in `nextjs-frontend/` and run:
   ```bash
   npm run build
   ```
2. Upload the newly generated build files (specifically the **`.next`** folder or compiled standalone files) to cPanel under your Next.js directory (`/home/clientswebbuilde/nextjs_app/`), overwriting the old files.
3. Go to cPanel ➔ **Setup Node.js App** and click **RESTART**.

### Step 2: Restart Frontend Node.js App
1. Make sure your backend subdomain `test.php` is working and shows "Hello World!".
2. Go to **Setup Node.js App** in cPanel.
3. Click **START** on the Next.js application.

---
*Created on 2026-05-18 for Bharath.*
