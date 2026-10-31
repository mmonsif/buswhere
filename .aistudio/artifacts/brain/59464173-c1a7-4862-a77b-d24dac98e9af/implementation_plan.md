# Production Deployment & Parent WhatsApp Sharing Plan

This guide outlines the end-to-end operational roadmap to deploy the **BusWhere (ELS) School Bus Tracer** to an external Cloud VPS or Firebase Hosting environment, map your custom school domain with SSL, and distribute live links and login credentials to parents via automated one-click WhatsApp dispatch.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The deployment strategy is configured according to your confirmed selections:
> 1. **Hosting Method**: External Cloud VPS or Firebase Hosting for high availability, security, and custom domain mapping.
> 2. **Parent Link & Credential Delivery**: Automated one-click WhatsApp dispatch triggered directly from the School Admin console after fee verification.

- **Confirmed Decision 1**: External deployment using Firebase Hosting or a Cloud VPS (Node.js/Nginx/Docker).
- **Confirmed Decision 2**: Admin console automated WhatsApp message generation containing the live URL, phone username, and password.

---

## 1. Overview & Core Concept

### Objective
Transition the verified BusWhere application from development into a 24/7 public production system where:
1. School administration logs in at the live URL to manage buses, drivers, and verify student fees.
2. Once a parent's fee is marked paid, the Admin clicks **"Send Login Details via WhatsApp"**, sending the parent their direct portal link and login credentials.
3. Drivers and supervisors open the live link on their in-vehicle smartphone or tablet, select the **Driver & Supervisor** portal, and run their morning/afternoon routes.
4. Parents open the link on their mobile phones, sign in to the **Parent Portal**, and track their child's bus in real time.

---

## 2. Step-by-Step Production Deployment Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION GO-LIVE SEQUENCE                           │
│                                                                             │
│  [ Step 1: Production Build ] ───────> [ Step 2: Cloud Deployment ]         │
│  • Compile Vite SPA                    • Firebase Hosting OR                │
│  • Output in /dist directory           • Cloud VPS (Nginx / Docker)         │
│                                                       │                     │
│                                                       ▼                     │
│  [ Step 4: In-Vehicle GPS Start ] <─── [ Step 3: Domain & HTTPS Setup ]     │
│  • Driver opens live URL               • Map bus.els-schools.com            │
│  • Mount on dashboard                  • Automated SSL Certificate          │
│                                                       │                     │
│                                                       ▼                     │
│                             [ Step 5: Parent WhatsApp Dispatch ]            │
│                             • Admin confirms fee payment                    │
│                             • Generates password & clicks WhatsApp          │
│                             • Parent receives link & logs in                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Generate the Production Web Bundle

In your project root, run:
```bash
npm run build
```
This produces an optimized, minified single-page application (SPA) in the `/dist` directory containing all assets, CSS, icons, and Leaflet map scripts.

---

### Step 2: Deployment Options

#### Option A: Deploying to Firebase Hosting (Recommended for Ease & Speed)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Log in to Firebase**:
   ```bash
   firebase login
   ```
3. **Initialize Firebase in the project**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project.
   - Specify your public directory: `dist`.
   - Configure as a single-page app (rewrite all URLs to `/index.html`): `Yes`.
   - Set up automatic builds and deploys with GitHub: `Optional`.
4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```
   Firebase will output your live URL (e.g., `https://els-buswhere.web.app`).

---

#### Option B: Deploying to an External Cloud VPS (Ubuntu / Nginx / DigitalOcean / AWS)

1. **Provision a Linux VPS** (Ubuntu 22.04 LTS or 24.04 LTS).
2. **Install Nginx**:
   ```bash
   sudo apt update && sudo apt install nginx -y
   ```
3. **Upload the `/dist` directory** to `/var/www/buswhere`:
   ```bash
   scp -r dist/* user@YOUR_SERVER_IP:/var/www/buswhere/
   ```
4. **Configure Nginx SPA routing** (`/etc/nginx/sites-available/buswhere`):
   ```nginx
   server {
       listen 80;
       server_name bus.els-schools.com;

       root /var/www/buswhere;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
5. **Enable site and reload Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/buswhere /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
6. **Install Free Let's Encrypt SSL**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d bus.els-schools.com
   ```

---

### Step 3: Custom Domain & DNS Mapping

To make the link look professional for school parents:
1. In your domain provider (e.g. GoDaddy, Cloudflare, Namecheap):
   - Add a `CNAME` record:
     - Name: `bus` (or `tracker`)
     - Target: your Firebase or VPS domain
   - Or add an `A` record pointing to your VPS IP address.
2. In Firebase Console $\rightarrow$ **Hosting** $\rightarrow$ **Custom domain**, add `bus.els-schools.com`. Firebase will automatically provision an SSL certificate.

---

### Step 4: In-Vehicle Driver & Supervisor Setup

1. Provide the bus driver and supervisor with a phone or tablet mounted on the dashboard with a charging cable.
2. Open the browser and navigate to the live URL: `https://bus.els-schools.com`.
3. In Chrome/Safari, tap **"Add to Home Screen"** to install it as an app icon.
4. Driver/Supervisor logs in using their credentials (e.g. `01001112233 / 1234`).
5. Tap **"Start Morning Route"** when departing the depot.

---

### Step 5: Sharing the Live Link & Credentials with Parents (Automated WhatsApp Dispatch)

The Admin portal has this workflow built in:

1. **Log in as Admin** at your live URL:
   - Phone: `01000000000`
   - Password: `admin123`
2. Go to the **"Parent Accounts & Credentials"** tab.
3. **When a parent pays their bus fees**:
   - Click **"Create & Activate Parent Account"** (or find existing parent in table).
   - Check the box: *"Confirm bus fees paid & activate account"*.
   - Click **"Generate Secure Password"** (e.g. `ELS-4821`).
   - Click **Save**.
4. **Send via WhatsApp**:
   - In the table row, click the green **"Send Login Details via WhatsApp"** button.
   - WhatsApp will open with the following message populated to the parent's phone number:
     ```text
     السلام عليكم يا فندم، تم تفعيل اشتراك باص المدرسة المصرية للغات (ELS) بنجاح بعد سداد الرسوم المقررة.
     بيانات الدخول لمنصة تتبع الباص:
     - رقم الموبايل: 01001234567
     - كلمة المرور: ELS-4821
     - رابط الدخول: https://bus.els-schools.com
     نتمنى لأبنائنا رحلات آمنة وسعيدة.
     ```
   - The parent receives the WhatsApp message, taps the link, enters their credentials, and is immediately locked into their child's live tracker!
