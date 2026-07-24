# GymDate - Project Deployment Guide

This comprehensive guide details all deployment steps, server details, environment configurations, and SSH commands used to deploy the **GymDate** platform (Next.js Web App, KVM Remote Database Server, and Expo Mobile App).

---

## 1. Server & SSH Credentials

### **KVM VPS / Database Server**
* **Server IP Address:** `77.37.44.221`
* **SSH Username:** `root` (or `ubuntu`)
* **SSH Port:** `22`
* **SSH Login Command:**
  ```bash
  ssh root@77.37.44.221
  ```

### **PostgreSQL Database Credentials**
* **Host:** `77.37.44.221`
* **Port:** `5432`
* **Database Name:** `gymdate_db`
* **Database User:** `gymdate_user`
* **Database Password:** `GymDate@DB2024!`
* **PostgreSQL Connection String:**
  ```text
  postgresql://gymdate_user:GymDate@DB2024!@77.37.44.221:5432/gymdate_db
  ```

### **Domain & Production URLs**
* **Primary Domain:** [https://gymdate.in](https://gymdate.in)
* **Vercel Mirror / Staging:** [https://gym-date-fqml.vercel.app](https://gym-date-fqml.vercel.app)
* **Supabase Auth / API Endpoint:** `https://dsypmgfsibqogvbepgml.supabase.co`

---

## 2. Step-by-Step SSH Deployment Commands

Below are all the exact terminal / SSH commands used during initial server configuration, database installation, reverse proxy setup, and PM2 process management.

### **Step 2.1: Connect to VPS via SSH**
Open your terminal or PowerShell and log into the server:
```bash
ssh root@77.37.44.221
```
*(Enter server root password when prompted)*

---

### **Step 2.2: Update System & Install Core Dependencies**
```bash
# Update package list and system packages
sudo apt update && sudo apt upgrade -y

# Install essential utilities
sudo apt install -y curl git build-essential nginx ufw certbot python3-certbot-nginx postgresql postgresql-contrib
```

---

### **Step 2.3: Install Node.js (v20 LTS) & PM2**
```bash
# Download and setup NodeSource repository for Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v

# Install PM2 globally to manage Next.js background process
sudo npm install -g pm2
```

---

### **Step 2.4: PostgreSQL Setup on Server (`77.37.44.221`)**

1. **Log into PostgreSQL as `postgres` user:**
   ```bash
   sudo -u postgres psql
   ```

2. **Execute Database Creation & User Authorization SQL Commands:**
   ```sql
   CREATE DATABASE gymdate_db;
   CREATE USER gymdate_user WITH ENCRYPTED PASSWORD 'GymDate@DB2024!';
   GRANT ALL PRIVILEGES ON DATABASE gymdate_db TO gymdate_user;
   ALTER DATABASE gymdate_db OWNER TO gymdate_user;
   \c gymdate_db
   GRANT ALL ON SCHEMA public TO gymdate_user;
   \q
   ```

3. **Configure Remote PostgreSQL Connections (Allow Port 5432):**
   ```bash
   # Edit postgresql.conf to listen on all interfaces
   sudo nano /etc/postgresql/16/main/postgresql.conf
   # Change: listen_addresses = '*'

   # Edit pg_hba.conf to grant access
   sudo nano /etc/postgresql/16/main/pg_hba.conf
   # Add line at end:
   # host    gymdate_db      gymdate_user    0.0.0.0/0               scram-sha-256

   # Restart PostgreSQL service
   sudo systemctl restart postgresql
   ```

4. **Firewall Rule for Database Port:**
   ```bash
   sudo ufw allow 5432/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

5. **Import Database Schemas:**
   ```bash
   psql -U gymdate_user -h 77.37.44.221 -d gymdate_db -f /path/to/postgres_schema.sql
   ```

---

### **Step 2.5: Deploy Next.js Web App on Server**

1. **Clone Project Repository:**
   ```bash
   cd /var/www
   git clone https://github.com/neelaakhil12/gym-date.git gymdate
   cd gymdate
   ```

2. **Create Production Environment File (`.env.local`):**
   ```bash
   nano .env.local
   ```
   *Paste environment variables (see Section 3 below) and save (`Ctrl+O`, `Enter`, `Ctrl+X`).*

3. **Install Dependencies & Build Project:**
   ```bash
   npm install --legacy-peer-deps
   npm run build
   ```

4. **Start Application with PM2:**
   ```bash
   pm2 start npm --name "gymdate-web" -- start -- -p 3000
   pm2 save
   pm2 startup
   ```
   *(Follow the instructions printed by `pm2 startup` to automatically restart on server boot).*

---

### **Step 2.6: Configure Nginx Reverse Proxy**

1. **Create Nginx Configuration File:**
   ```bash
   sudo nano /etc/nginx/sites-available/gymdate
   ```

2. **Add Server Block:**
   ```nginx
   server {
       server_name gymdate.in www.gymdate.in;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable Site and Reload Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/gymdate /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### **Step 2.7: Install SSL Certificate (Certbot)**
```bash
sudo certbot --nginx -d gymdate.in -d www.gymdate.in
```
*(Select automatic redirect HTTP to HTTPS when prompted).*

---

## 3. Environment Variables Configuration (`.env.local`)

Ensure the following variables are present in `.env.local` on the production server or Vercel:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dsypmgfsibqogvbepgml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeXBtZ2ZzaWJxb2d2YmVwZ21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTgyMjksImV4cCI6MjA5MjY5NDIyOX0.aEfBawkE038NFl7Ptbc4_xFVBvmVobDlx95rrPrZjh0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeXBtZ2ZzaWJxb2d2YmVwZ21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExODIyOSwiZXhwIjoyMDkyNjk0MjI5fQ.DE1JE9MffOPVf1oxHAJ4KjsCAyLBa3o_ia7VLExjatg

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=santoedgepvtltd@gmail.com
SMTP_PASSWORD=oeanzlhzcmhxkkpb
SMTP_FROM="GymDate <santoedgepvtltd@gmail.com>"
NEXT_PUBLIC_SITE_URL=https://gymdate.in

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=b202bb84be5443b33546d371098b833c0ca8ec08d4eac7ac7ff4fad538115c0957b0bf60175fc39a53865428ca1ff8f453d13bf16c1883e5a409ecad09ec3e89
NEXTAUTH_URL=https://gymdate.in

# Razorpay Integration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Skrzer6PadObbZ
RAZORPAY_KEY_SECRET=Jl1O3BYh6YuUlPpbSvYk6hm6

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA_y5PoTdP0o2MZRDGkTVtFgguLTSaGIEE

# Remote PostgreSQL Connection
DATABASE_URL=postgresql://gymdate_user:GymDate@DB2024!@77.37.44.221:5432/gymdate_db
```

---

## 4. Mobile App Deployment (`gymdate-app`) via Expo / EAS

For building and publishing the React Native Expo app (`gymdate-app`):

### **Commands:**
```bash
cd gymdate-app

# Log in to Expo account
npx eas-cli login

# Configure / Check build profiles
npx eas-cli build:configure

# Build Android APK / AAB
npx eas build --platform android --profile production

# Build iOS App Store Package
npx eas build --platform ios --profile production

# Submit build to App Stores
npx eas submit --platform all
```

---

## 5. Server Maintenance & Operation Commands

Quick commands for managing the live application on server `77.37.44.221`:

```bash
# Check PM2 Status
pm2 status

# View live application logs
pm2 logs gymdate-web

# Restart Web Application
pm2 restart gymdate-web

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Test Database Connection locally
node scratch/test_kvm_connection.js
```
