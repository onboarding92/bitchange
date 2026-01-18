# BitChange Pro - System Administrator Guide

**Version:** 1.0  
**Last Updated:** January 17, 2026  
**Author:** BitChange Development Team

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Server Requirements](#server-requirements)
4. [Installation & Deployment](#installation--deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Management](#database-management)
7. [Docker Container Management](#docker-container-management)
8. [Backup & Recovery](#backup--recovery)
9. [Security Best Practices](#security-best-practices)
10. [Monitoring & Logging](#monitoring--logging)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance Procedures](#maintenance-procedures)
13. [Wallet & Cryptography](#wallet--cryptography)
14. [Performance Optimization](#performance-optimization)
15. [Disaster Recovery](#disaster-recovery)

---

## Introduction

BitChange Pro is a professional cryptocurrency exchange platform built with modern web technologies. This guide provides comprehensive instructions for system administrators responsible for deploying, maintaining, and securing the platform in a production environment.

### Technology Stack

The platform is built using the following technologies:

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | React 19 |
| **Backend** | Node.js + Express + tRPC | Node 22.x |
| **Database** | MySQL | 8.0+ |
| **Runtime** | Docker + Docker Compose | Latest |
| **Web Server** | Nginx (reverse proxy) | Latest |
| **Process Manager** | PM2 (optional) | Latest |

### Key Features

- Real-time cryptocurrency trading engine
- Multi-currency wallet system (BTC, ETH, USDT, USDC, BNB, SOL, MATIC)
- KYC verification system
- Two-Factor Authentication (2FA)
- Admin dashboard with analytics
- Staking and rewards system
- Referral program
- Support ticket system

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Firewall   │
                    │  (iptables)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │     Nginx    │
                    │ (Port 80/443)│
                    └──────┬───────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   Docker Container   │
                │  bitchange-app:3000  │
                │                      │
                │  ┌────────────────┐  │
                │  │  Node.js App   │  │
                │  │  (Express +    │  │
                │  │   tRPC API)    │  │
                │  └────────┬───────┘  │
                │           │          │
                └───────────┼──────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  MySQL 8.0    │
                    │  (Port 3306)  │
                    └───────────────┘
```

### Directory Structure

```
/root/exchange/                    # Main application directory
├── app/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and helpers
│   ├── pages/                    # Page components
│   └── routes/                   # Route definitions
├── server/                       # Backend Node.js application
│   ├── _core/                    # Core server functionality
│   ├── routers.ts                # tRPC API routes
│   ├── db.ts                     # Database helpers
│   ├── auth.ts                   # Authentication logic
│   ├── walletGenerator.ts        # Wallet generation
│   ├── tradingEngine.ts          # Trading engine
│   └── jobs/                     # Background jobs
├── drizzle/                      # Database schema and migrations
│   ├── schema.ts                 # Database schema definition
│   └── migrations/               # SQL migration files
├── docker-compose.yml            # Docker configuration
├── Dockerfile                    # Container build instructions
├── package.json                  # Node.js dependencies
└── .env                          # Environment variables (CRITICAL)
```

---

## Server Requirements

### Minimum Requirements

For a production deployment handling 100+ users daily:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 50 GB SSD | 100 GB SSD |
| **Network** | 100 Mbps | 1 Gbps |
| **OS** | AlmaLinux 9/10, Ubuntu 22.04+, CentOS 8+ | AlmaLinux 10 |

### Required Software

Before deployment, ensure the following software is installed:

```bash
# Update system packages
sudo yum update -y  # AlmaLinux/CentOS
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install git -y  # AlmaLinux/CentOS
# OR
sudo apt install git -y  # Ubuntu

# Install Nginx (optional, for reverse proxy)
sudo yum install nginx -y  # AlmaLinux/CentOS
# OR
sudo apt install nginx -y  # Ubuntu

# Verify installations
docker --version
docker-compose --version
git --version
nginx -v
```

---

## Installation & Deployment

### Initial Setup

#### Step 1: Clone Repository

```bash
# Navigate to deployment directory
cd /root

# Clone from GitHub
git clone https://github.com/onboarding92/exchange.git
cd exchange

# Verify files
ls -la
```

#### Step 2: Configure Environment Variables

Create or edit the `.env` file with all required configuration:

```bash
nano .env
```

**Critical Environment Variables:**

```bash
# Database Configuration
DATABASE_URL="mysql://bitchange_user:SECURE_PASSWORD@localhost:3306/bitchange_db"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Wallet Encryption
WALLET_MASTER_SEED="your-master-seed-for-hd-wallets-keep-this-safe"
WALLET_ENCRYPTION_KEY="32-byte-encryption-key-for-wallet-security"

# Email Configuration (SendGrid)
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="noreply@bitchangemoney.xyz"
SENDGRID_FROM_NAME="BitChange Pro"

# Application Settings
NODE_ENV="production"
PORT="3000"
FRONTEND_URL="https://bitchangemoney.xyz"

# Session Configuration
SESSION_SECRET="another-secure-random-string-for-sessions"

# CoinGecko API (for price feeds)
COINGECKO_API_KEY="optional-api-key-for-higher-rate-limits"
```

**⚠️ SECURITY WARNING:** Never commit `.env` files to version control. Keep backups in a secure location.

#### Step 3: Build Docker Container

```bash
# Build the Docker image
docker-compose build

# This will:
# - Install Node.js dependencies
# - Build the frontend (React + Vite)
# - Prepare the backend (Node.js + Express)
# - Create optimized production build
```

#### Step 4: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Verify containers are running
docker ps

# Expected output:
# CONTAINER ID   IMAGE              STATUS         PORTS
# abc123def456   bitchange-app      Up 2 minutes   0.0.0.0:3000->3000/tcp
```

#### Step 5: Initialize Database

```bash
# Run database migrations
docker exec -it bitchange-app npm run db:push

# Verify database tables
docker exec -it bitchange-app npm run db:studio
# This opens Drizzle Studio on http://localhost:4983
```

#### Step 6: Create Admin User

```bash
# Access MySQL directly
mysql -u bitchange_user -p bitchange_db

# Create admin user
INSERT INTO users (email, name, password, role, emailVerified, createdAt, updatedAt, lastSignedIn)
VALUES (
  'admin@bitchangemoney.xyz',
  'Admin User',
  '$2a$10$HASHED_PASSWORD_HERE',  -- Use bcrypt to hash password
  'admin',
  NOW(),
  NOW(),
  NOW(),
  NOW()
);

# Exit MySQL
EXIT;
```

**Generate bcrypt password hash:**

```bash
# Using Node.js
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourSecurePassword123!', 10));"
```

---

## Environment Configuration

### Complete Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | ✅ Yes | Secret for JWT token signing | `random-32-byte-string` |
| `WALLET_MASTER_SEED` | ✅ Yes | Master seed for HD wallet derivation | `12-24 word mnemonic phrase` |
| `WALLET_ENCRYPTION_KEY` | ✅ Yes | AES-256 encryption key for wallet data | `32-byte-hex-string` |
| `SENDGRID_API_KEY` | ✅ Yes | SendGrid API key for emails | `SG.xxxxxxxxxx` |
| `SENDGRID_FROM_EMAIL` | ✅ Yes | Sender email address | `noreply@domain.com` |
| `SENDGRID_FROM_NAME` | ✅ Yes | Sender display name | `BitChange Pro` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `PORT` | ✅ Yes | Application port | `3000` |
| `FRONTEND_URL` | ✅ Yes | Public URL of the site | `https://bitchangemoney.xyz` |
| `SESSION_SECRET` | ✅ Yes | Session cookie encryption | `random-string` |
| `COINGECKO_API_KEY` | ❌ No | CoinGecko API key (optional) | `CG-xxxxxxxxxx` |

### Generating Secure Secrets

```bash
# Generate JWT_SECRET (32 bytes)
openssl rand -base64 32

# Generate WALLET_ENCRYPTION_KEY (32 bytes hex)
openssl rand -hex 32

# Generate SESSION_SECRET
openssl rand -base64 32

# Generate WALLET_MASTER_SEED (BIP39 mnemonic)
# Use a BIP39 generator tool or:
npm install -g bip39-cli
bip39-cli generate
```

---

## Database Management

### Database Schema

The platform uses MySQL 8.0+ with the following main tables:

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts | `id`, `email`, `password`, `role`, `kycStatus` |
| `wallets` | User cryptocurrency balances | `userId`, `asset`, `balance`, `locked` |
| `depositAddresses` | Generated deposit addresses | `userId`, `asset`, `address`, `network` |
| `deposits` | Deposit transactions | `userId`, `asset`, `amount`, `status` |
| `withdrawals` | Withdrawal requests | `userId`, `asset`, `amount`, `status` |
| `orders` | Trading orders | `userId`, `pair`, `side`, `price`, `amount` |
| `trades` | Executed trades | `buyerId`, `sellerId`, `pair`, `price` |
| `stakingPositions` | Active staking positions | `userId`, `planId`, `amount`, `maturesAt` |
| `kycDocuments` | KYC verification documents | `userId`, `status`, `idFrontUrl` |
| `supportTickets` | Customer support tickets | `userId`, `subject`, `status` |

### Database Backup

**Automated Daily Backup Script:**

```bash
#!/bin/bash
# /root/scripts/backup-database.sh

# Configuration
DB_USER="bitchange_user"
DB_PASS="YOUR_DB_PASSWORD"
DB_NAME="bitchange_db"
BACKUP_DIR="/root/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bitchange_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

**Make script executable and schedule with cron:**

```bash
chmod +x /root/scripts/backup-database.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /root/scripts/backup-database.sh >> /var/log/bitchange-backup.log 2>&1
```

### Database Restore

```bash
# Restore from backup
gunzip < /root/backups/database/bitchange_20260117_020000.sql.gz | mysql -u bitchange_user -p bitchange_db

# Verify restoration
mysql -u bitchange_user -p bitchange_db -e "SELECT COUNT(*) FROM users;"
```

### Database Maintenance

```bash
# Optimize all tables (run weekly)
mysqlcheck -u bitchange_user -p --optimize bitchange_db

# Analyze tables for query optimization
mysqlcheck -u bitchange_user -p --analyze bitchange_db

# Check for corrupted tables
mysqlcheck -u bitchange_user -p --check bitchange_db

# Repair tables if needed
mysqlcheck -u bitchange_user -p --repair bitchange_db
```

---

## Docker Container Management

### Common Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs bitchange-app

# Follow logs in real-time
docker logs -f bitchange-app

# View last 100 lines of logs
docker logs --tail 100 bitchange-app

# Execute command inside container
docker exec -it bitchange-app bash

# Restart container
docker restart bitchange-app

# Stop container
docker stop bitchange-app

# Start container
docker start bitchange-app

# Remove container (must be stopped first)
docker stop bitchange-app
docker rm bitchange-app

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Container Health Checks

```bash
# Check container resource usage
docker stats bitchange-app

# Inspect container configuration
docker inspect bitchange-app

# View container IP address
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' bitchange-app
```

### Updating the Application

```bash
# Step 1: Pull latest code from GitHub
cd /root/exchange
git pull origin main

# Step 2: Rebuild Docker image
docker-compose build

# Step 3: Stop old container
docker-compose down

# Step 4: Start new container
docker-compose up -d

# Step 5: Verify deployment
docker logs -f bitchange-app

# Step 6: Test application
curl http://localhost:3000/health
```

---

## Backup & Recovery

### Critical Files to Backup

| File/Directory | Priority | Backup Frequency | Storage Location |
|----------------|----------|------------------|------------------|
| `.env` | 🔴 Critical | After every change | Encrypted offsite |
| Database dumps | 🔴 Critical | Daily | Multiple locations |
| `/root/exchange/` | 🟡 Important | Weekly | Version control (Git) |
| Docker volumes | 🟡 Important | Weekly | Backup server |
| Nginx configs | 🟢 Normal | After changes | Version control |
| SSL certificates | 🟢 Normal | After renewal | Encrypted backup |

### Complete Backup Script

```bash
#!/bin/bash
# /root/scripts/full-backup.sh

BACKUP_ROOT="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/full_$DATE"

mkdir -p $BACKUP_DIR

# 1. Backup database
echo "Backing up database..."
mysqldump -u bitchange_user -p$DB_PASSWORD bitchange_db | gzip > $BACKUP_DIR/database.sql.gz

# 2. Backup environment file
echo "Backing up environment..."
cp /root/exchange/.env $BACKUP_DIR/.env

# 3. Backup application code
echo "Backing up application..."
tar -czf $BACKUP_DIR/application.tar.gz /root/exchange

# 4. Backup Docker volumes
echo "Backing up Docker volumes..."
docker run --rm -v bitchange_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/docker-volumes.tar.gz /data

# 5. Create backup manifest
echo "Creating manifest..."
cat > $BACKUP_DIR/MANIFEST.txt <<EOF
Backup Date: $(date)
Database: bitchange_db
Application Version: $(cd /root/exchange && git rev-parse HEAD)
Docker Image: $(docker images bitchange-app --format "{{.ID}}")
EOF

# 6. Encrypt backup (optional but recommended)
echo "Encrypting backup..."
tar -czf - $BACKUP_DIR | openssl enc -aes-256-cbc -salt -out $BACKUP_ROOT/encrypted_backup_$DATE.tar.gz.enc -pass pass:YOUR_ENCRYPTION_PASSWORD

# 7. Upload to remote storage (optional)
# rsync -avz $BACKUP_DIR/ user@backup-server:/backups/bitchange/

# 8. Cleanup old backups (keep last 30 days)
find $BACKUP_ROOT -name "full_*" -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR"
```

### Disaster Recovery Procedure

**Complete System Restore:**

```bash
# 1. Install fresh server with required software (Docker, MySQL, etc.)

# 2. Restore environment file
cp /path/to/backup/.env /root/exchange/.env

# 3. Restore database
gunzip < /path/to/backup/database.sql.gz | mysql -u bitchange_user -p bitchange_db

# 4. Restore application code
cd /root
tar -xzf /path/to/backup/application.tar.gz

# 5. Rebuild Docker container
cd /root/exchange
docker-compose build
docker-compose up -d

# 6. Verify all services
docker ps
curl http://localhost:3000/health

# 7. Test critical functionality
# - Login as admin
# - Check user balances
# - Verify trading engine
# - Test deposit/withdrawal
```

---

## Security Best Practices

### Firewall Configuration

```bash
# Install firewalld (AlmaLinux/CentOS)
sudo yum install firewalld -y
sudo systemctl start firewalld
sudo systemctl enable firewalld

# OR install ufw (Ubuntu)
sudo apt install ufw -y
sudo ufw enable

# Allow SSH (CRITICAL - do this first!)
sudo firewall-cmd --permanent --add-service=ssh  # firewalld
sudo ufw allow 22/tcp  # ufw

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to application port (only allow from localhost)
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="127.0.0.1" port port="3000" protocol="tcp" accept'

# Reload firewall
sudo firewall-cmd --reload  # firewalld
sudo ufw reload  # ufw

# Verify rules
sudo firewall-cmd --list-all  # firewalld
sudo ufw status verbose  # ufw
```

### SSL/TLS Configuration

**Using Certbot (Let's Encrypt):**

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y  # AlmaLinux/CentOS
# OR
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Obtain certificate
sudo certbot --nginx -d bitchangemoney.xyz -d www.bitchangemoney.xyz

# Auto-renewal (certbot creates cron job automatically)
# Verify auto-renewal
sudo certbot renew --dry-run
```

**Nginx SSL Configuration:**

```nginx
# /etc/nginx/conf.d/bitchange.conf

server {
    listen 80;
    server_name bitchangemoney.xyz www.bitchangemoney.xyz;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bitchangemoney.xyz www.bitchangemoney.xyz;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/bitchangemoney.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bitchangemoney.xyz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

### SSH Hardening

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
Port 22  # Consider changing to non-standard port
PermitRootLogin no  # Disable root login (create sudo user first!)
PasswordAuthentication no  # Use SSH keys only
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH service
sudo systemctl restart sshd
```

### Database Security

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create dedicated database user (not root)
mysql -u root -p

CREATE DATABASE bitchange_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bitchange_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON bitchange_db.* TO 'bitchange_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Restrict MySQL to localhost only
sudo nano /etc/my.cnf

[mysqld]
bind-address = 127.0.0.1

# Restart MySQL
sudo systemctl restart mysqld
```

---

## Monitoring & Logging

### Application Logs

```bash
# View real-time application logs
docker logs -f bitchange-app

# View logs with timestamps
docker logs -f --timestamps bitchange-app

# View last 500 lines
docker logs --tail 500 bitchange-app

# Save logs to file
docker logs bitchange-app > /var/log/bitchange-app.log
```

### System Monitoring

**Install monitoring tools:**

```bash
# Install htop for resource monitoring
sudo yum install htop -y  # AlmaLinux/CentOS
sudo apt install htop -y  # Ubuntu

# Install netdata for web-based monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access netdata dashboard
# http://YOUR_SERVER_IP:19999
```

### Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/bitchange

/var/log/bitchange-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker kill -s USR1 bitchange-app
    endscript
}
```

### Monitoring Checklist

**Daily Checks:**
- [ ] Application is running (`docker ps`)
- [ ] No critical errors in logs (`docker logs bitchange-app | grep ERROR`)
- [ ] Database is accessible (`mysql -u bitchange_user -p -e "SELECT 1"`)
- [ ] Disk space available (`df -h`)

**Weekly Checks:**
- [ ] Review security logs (`/var/log/secure` or `/var/log/auth.log`)
- [ ] Check for pending system updates (`yum check-update` or `apt list --upgradable`)
- [ ] Verify backup integrity
- [ ] Review user activity logs

**Monthly Checks:**
- [ ] SSL certificate expiration (`certbot certificates`)
- [ ] Database performance analysis
- [ ] Review and update firewall rules
- [ ] Security audit

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Container Won't Start

**Symptoms:** `docker-compose up -d` fails or container exits immediately

**Diagnosis:**
```bash
# Check container logs
docker logs bitchange-app

# Check Docker Compose logs
docker-compose logs

# Verify environment variables
docker exec bitchange-app env | grep DATABASE_URL
```

**Solutions:**
- Verify `.env` file exists and has correct values
- Check database connection: `mysql -u bitchange_user -p -h localhost bitchange_db`
- Ensure port 3000 is not already in use: `netstat -tulpn | grep 3000`
- Rebuild container: `docker-compose down && docker-compose build && docker-compose up -d`

#### Issue 2: Database Connection Errors

**Symptoms:** "Error: connect ECONNREFUSED" or "Access denied for user"

**Diagnosis:**
```bash
# Test database connection
mysql -u bitchange_user -p bitchange_db

# Check MySQL is running
sudo systemctl status mysqld  # AlmaLinux/CentOS
sudo systemctl status mysql   # Ubuntu

# Verify user permissions
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User='bitchange_user';"
```

**Solutions:**
- Restart MySQL: `sudo systemctl restart mysqld`
- Verify `DATABASE_URL` in `.env` matches actual credentials
- Grant proper permissions: `GRANT ALL PRIVILEGES ON bitchange_db.* TO 'bitchange_user'@'localhost';`
- Check MySQL logs: `sudo tail -f /var/log/mysqld.log`

#### Issue 3: Application Returns 502 Bad Gateway

**Symptoms:** Nginx shows 502 error when accessing site

**Diagnosis:**
```bash
# Check if application is running
docker ps | grep bitchange-app

# Test direct connection to app
curl http://localhost:3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Solutions:**
- Restart application container: `docker restart bitchange-app`
- Verify Nginx proxy configuration: `sudo nginx -t`
- Check firewall allows connection from Nginx to app
- Restart Nginx: `sudo systemctl restart nginx`

#### Issue 4: High Memory Usage

**Symptoms:** Server becomes slow, OOM (Out of Memory) errors

**Diagnosis:**
```bash
# Check memory usage
free -h

# Check container memory usage
docker stats bitchange-app

# Check for memory leaks
docker exec bitchange-app node --expose-gc -e "console.log(process.memoryUsage())"
```

**Solutions:**
- Restart container to clear memory: `docker restart bitchange-app`
- Increase server RAM
- Set memory limits in `docker-compose.yml`:
  ```yaml
  services:
    app:
      mem_limit: 2g
      mem_reservation: 1g
  ```
- Optimize database queries
- Enable swap if not already enabled

#### Issue 5: Price Sync Job Failing

**Symptoms:** Prices not updating, "CoinGecko API error" in logs

**Diagnosis:**
```bash
# Check logs for price sync errors
docker logs bitchange-app | grep PriceSyncJob

# Test CoinGecko API manually
curl "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
```

**Solutions:**
- Verify internet connectivity: `ping api.coingecko.com`
- Check if IP is rate-limited by CoinGecko
- Add `COINGECKO_API_KEY` to `.env` for higher rate limits
- Increase sync interval in `server/jobs/priceSync.ts`

---

## Maintenance Procedures

### Routine Maintenance Schedule

| Task | Frequency | Command/Procedure |
|------|-----------|-------------------|
| Check logs | Daily | `docker logs bitchange-app \| tail -100` |
| Database backup | Daily | `/root/scripts/backup-database.sh` |
| System updates | Weekly | `sudo yum update -y && sudo reboot` |
| Database optimization | Weekly | `mysqlcheck -o bitchange_db` |
| SSL certificate renewal | Auto (90 days) | `sudo certbot renew` |
| Full system backup | Weekly | `/root/scripts/full-backup.sh` |
| Security audit | Monthly | Review logs, update packages |
| Disaster recovery test | Quarterly | Restore from backup to test server |

### Updating Node.js Dependencies

```bash
# Enter project directory
cd /root/exchange

# Check for outdated packages
npm outdated

# Update packages (be careful with major version updates)
npm update

# Or update specific package
npm update package-name

# Rebuild Docker image
docker-compose build

# Deploy update
docker-compose down && docker-compose up -d
```

### Database Migration

```bash
# When schema changes are needed:

# 1. Stop application
docker-compose down

# 2. Backup database first!
mysqldump -u bitchange_user -p bitchange_db > /root/backups/pre-migration-$(date +%Y%m%d).sql

# 3. Apply migrations
docker-compose up -d
docker exec -it bitchange-app npm run db:push

# 4. Verify migration
docker exec -it bitchange-app npm run db:studio

# 5. If migration fails, restore backup
mysql -u bitchange_user -p bitchange_db < /root/backups/pre-migration-YYYYMMDD.sql
```

---

## Wallet & Cryptography

### Wallet System Architecture

BitChange Pro uses **Hierarchical Deterministic (HD) Wallets** for generating cryptocurrency addresses. This allows generating unlimited addresses from a single master seed.

**Key Concepts:**

- **Master Seed:** A 12-24 word BIP39 mnemonic phrase that can regenerate all wallet addresses
- **Derivation Path:** BIP32/BIP44 paths used to generate specific addresses
- **Encryption:** All sensitive data is encrypted with AES-256-GCM

### Critical Wallet Security

**⚠️ CRITICAL: The `WALLET_MASTER_SEED` is the most important secret in the entire system.**

If this seed is lost or compromised:
- **Lost:** All user funds become inaccessible (cannot generate deposit addresses)
- **Compromised:** Attacker can generate all user addresses and potentially steal funds

**Backup Procedure:**

```bash
# 1. Extract master seed from .env
grep WALLET_MASTER_SEED /root/exchange/.env

# 2. Write seed on paper (NOT digital)
# Example: "witch collapse practice feed shame open despair creek road again ice least"

# 3. Store in multiple secure locations:
#    - Physical safe
#    - Bank safety deposit box
#    - Encrypted USB drive in separate location

# 4. NEVER store seed in:
#    - Email
#    - Cloud storage (Dropbox, Google Drive, etc.)
#    - Unencrypted files
#    - Version control (Git)
```

### Wallet Recovery Procedure

If server is lost but you have the `WALLET_MASTER_SEED`:

```bash
# 1. Set up new server with fresh installation

# 2. Restore .env with same WALLET_MASTER_SEED
WALLET_MASTER_SEED="your-original-12-24-word-seed"

# 3. Restore database from backup
# (Database contains derivation indices for each user)

# 4. Restart application
docker-compose up -d

# 5. Verify addresses match
# Compare generated addresses with blockchain explorer
```

### Supported Cryptocurrencies

| Asset | Network | Address Format | Derivation Path |
|-------|---------|----------------|-----------------|
| BTC | Bitcoin | bc1... (SegWit) | m/84'/0'/0'/0/n |
| ETH | Ethereum | 0x... | m/44'/60'/0'/0/n |
| USDT | ERC-20 | 0x... | m/44'/60'/0'/0/n |
| USDT | TRC-20 | T... | Tron network |
| USDC | ERC-20 | 0x... | m/44'/60'/0'/0/n |
| USDC | SPL | (Solana) | Solana network |
| BNB | BEP-20 | 0x... | m/44'/60'/0'/0/n |
| SOL | Solana | (base58) | Solana network |
| MATIC | Polygon | 0x... | m/44'/60'/0'/0/n |

---

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_wallets_user_asset ON wallets(userId, asset);
CREATE INDEX idx_deposits_user_status ON deposits(userId, status);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_orders_user_pair ON orders(userId, pair, status);
CREATE INDEX idx_trades_pair_created ON trades(pair, createdAt);

-- Optimize queries
ANALYZE TABLE users, wallets, deposits, withdrawals, orders, trades;
```

### Caching Strategy

```bash
# Install Redis for caching (optional)
docker run -d --name redis -p 6379:6379 redis:alpine

# Update docker-compose.yml to include Redis
# Then use Redis for:
# - Price data caching (5-minute TTL)
# - User session storage
# - Rate limiting counters
```

### Load Balancing (for high traffic)

```nginx
# /etc/nginx/conf.d/bitchange.conf

upstream bitchange_backend {
    least_conn;
    server localhost:3000 weight=1;
    server localhost:3001 weight=1;
    server localhost:3002 weight=1;
}

server {
    listen 443 ssl http2;
    server_name bitchangemoney.xyz;
    
    location / {
        proxy_pass http://bitchange_backend;
        # ... other proxy settings
    }
}
```

---

## Disaster Recovery

### Recovery Time Objective (RTO)

Target: **< 4 hours** from disaster to full service restoration

### Recovery Point Objective (RPO)

Target: **< 1 hour** of data loss (based on daily backups + transaction logs)

### Disaster Scenarios and Procedures

#### Scenario 1: Server Hardware Failure

**Recovery Steps:**
1. Provision new server (1 hour)
2. Install required software (30 minutes)
3. Restore from latest backup (1 hour)
4. Update DNS if IP changed (30 minutes)
5. Verify all services (1 hour)

**Total RTO:** ~4 hours

#### Scenario 2: Database Corruption

**Recovery Steps:**
1. Stop application immediately
2. Assess corruption extent
3. Restore from latest backup
4. Replay transaction logs if available
5. Verify data integrity
6. Restart application

**Total RTO:** ~2 hours

#### Scenario 3: Security Breach

**Recovery Steps:**
1. Isolate affected systems immediately
2. Change all passwords and secrets
3. Audit all user accounts and transactions
4. Restore from clean backup if needed
5. Implement additional security measures
6. Notify affected users

**Total RTO:** ~8 hours (includes security audit)

---

## Appendix

### Useful Commands Reference

```bash
# System Information
uname -a                          # Kernel version
cat /etc/os-release               # OS version
df -h                             # Disk usage
free -h                           # Memory usage
htop                              # Interactive process viewer

# Docker Management
docker ps                         # Running containers
docker logs -f <container>        # Follow logs
docker exec -it <container> bash  # Enter container
docker stats                      # Resource usage
docker system prune -a            # Clean up unused resources

# Database Management
mysql -u user -p database         # Connect to MySQL
mysqldump -u user -p db > file    # Backup database
mysql -u user -p db < file        # Restore database
mysqlcheck -o database            # Optimize database

# Network Diagnostics
netstat -tulpn                    # Open ports
ss -tulpn                         # Socket statistics
curl -I https://domain.com        # Test HTTP response
ping domain.com                   # Test connectivity
traceroute domain.com             # Trace network path

# Process Management
ps aux | grep node                # Find Node.js processes
kill -9 <PID>                     # Force kill process
systemctl status service          # Check service status
journalctl -u service -f          # Follow service logs
```

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| **Lead Developer** | dev@bitchangemoney.xyz | 24/7 |
| **System Administrator** | sysadmin@bitchangemoney.xyz | Business hours |
| **Security Team** | security@bitchangemoney.xyz | 24/7 |
| **Database Administrator** | dba@bitchangemoney.xyz | Business hours |

### External Resources

- **Docker Documentation:** https://docs.docker.com/
- **MySQL Documentation:** https://dev.mysql.com/doc/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **CoinGecko API:** https://www.coingecko.com/en/api/documentation

---

**Document Version:** 1.0  
**Last Updated:** January 17, 2026  
**Next Review Date:** April 17, 2026

**© 2026 BitChange Pro. All rights reserved.**
