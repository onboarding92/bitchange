# BitChange Pro - VPS Operations Manual

## 📋 Table of Contents
1. [Server Information](#server-information)
2. [Directory Structure](#directory-structure)
3. [Common Commands](#common-commands)
4. [Database Operations](#database-operations)
5. [Docker Management](#docker-management)
6. [Deployment Process](#deployment-process)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)

---

## 🖥️ Server Information

**VPS Details:**
- **IP Address:** `46.224.87.94`
- **SSH Access:** `root@46.224.87.94`
- **Password:** `UdvAXcUeTPWK`
- **Domain:** `bitchangemoney.xyz`
- **SSL:** Enabled (Let's Encrypt)

**Services Running:**
- **Web Application:** Port 3000 (Node.js + Express)
- **MySQL Database:** Port 3306 (MySQL 8.0)
- **Redis Cache:** Port 6379
- **Nginx:** Port 80/443 (Reverse Proxy)

---

## 📁 Directory Structure

```
/opt/bitchange-pro/                 # Main application directory
├── client/                         # Frontend React application
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/                    # Utilities and tRPC client
│   │   └── contexts/               # React contexts
│   └── public/                     # Static assets
├── server/                         # Backend Express + tRPC
│   ├── routers.ts                  # tRPC API routes
│   ├── db.ts                       # Database queries
│   ├── businessMetrics.ts          # Business analytics
│   ├── portfolioAnalytics.ts       # User portfolio tracking
│   ├── alerting.ts                 # System alerts
│   ├── performanceMonitoring.ts    # Performance metrics
│   └── _core/                      # Core framework files
├── drizzle/                        # Database schema & migrations
│   ├── schema.ts                   # Database tables definition
│   └── migrations/                 # SQL migration files
├── docker-compose.yml              # Docker services configuration
├── Dockerfile                      # Application container build
├── package.json                    # Dependencies and scripts
└── .env                            # Environment variables (DO NOT COMMIT)
```

---

## ⚡ Common Commands

### SSH Connection
```bash
# Connect to VPS
ssh root@46.224.87.94

# Or with password in command (for scripts)
sshpass -p 'UdvAXcUeTPWK' ssh -o StrictHostKeyChecking=no root@46.224.87.94
```

### Navigate to Project
```bash
cd /opt/bitchange-pro
```

### Check Application Status
```bash
# Check all running containers
docker ps

# Check application logs
docker logs bitchange-pro-app-1 --tail 100 -f

# Check nginx logs
docker logs bitchange-pro-nginx-1 --tail 50

# Check database logs
docker logs bitchange-pro-db-1 --tail 50
```

### Restart Services
```bash
# Restart specific service
docker restart bitchange-pro-app-1

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

---

## 🗄️ Database Operations

### Access MySQL Database
```bash
# Method 1: Via Docker exec
docker exec -it bitchange-pro-db-1 mysql -u bitchange -p
# Password: bitchange_secure_2024

# Method 2: Direct connection (if MySQL client installed)
mysql -h localhost -u bitchange -p bitchange_pro
```

### Common Database Queries
```sql
-- Show all tables
SHOW TABLES;

-- Check users count
SELECT COUNT(*) FROM users;

-- Check recent transactions
SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 10;

-- Check system metrics
SELECT * FROM systemMetrics ORDER BY createdAt DESC LIMIT 20;

-- Check API logs
SELECT * FROM apiLogs ORDER BY createdAt DESC LIMIT 50;

-- Check alerts
SELECT * FROM alerts ORDER BY createdAt DESC LIMIT 10;
```

### Database Backup
```bash
# Create backup
docker exec bitchange-pro-db-1 mysqldump -u bitchange -pbitchange_secure_2024 bitchange_pro > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i bitchange-pro-db-1 mysql -u bitchange -pbitchange_secure_2024 bitchange_pro < backup_20241220_123456.sql
```

### Run Migrations
```bash
# Inside project directory
cd /opt/bitchange-pro

# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations to database
pnpm db:push

# Or manually execute SQL file
docker exec -i bitchange-pro-db-1 mysql -u bitchange -pbitchange_secure_2024 bitchange_pro < drizzle/migrations/0001_migration.sql
```

---

## 🐳 Docker Management

### View Container Status
```bash
# List all containers
docker ps -a

# View container resource usage
docker stats

# Inspect container details
docker inspect bitchange-pro-app-1
```

### Container Logs
```bash
# Follow logs in real-time
docker logs -f bitchange-pro-app-1

# Show last 100 lines
docker logs --tail 100 bitchange-pro-app-1

# Show logs with timestamps
docker logs -t bitchange-pro-app-1

# Show logs from last hour
docker logs --since 1h bitchange-pro-app-1
```

### Execute Commands in Container
```bash
# Open bash shell in app container
docker exec -it bitchange-pro-app-1 bash

# Run Node.js command
docker exec bitchange-pro-app-1 node -v

# Check environment variables
docker exec bitchange-pro-app-1 env
```

### Rebuild Containers
```bash
# Rebuild and restart all services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Rebuild only app container
docker-compose build app
docker-compose up -d app
```

---

## 🚀 Deployment Process

### Standard Deployment (Recommended)
```bash
# 1. SSH into VPS
ssh root@46.224.87.94

# 2. Navigate to project
cd /opt/bitchange-pro

# 3. Pull latest code from GitHub
git pull origin main

# 4. Install dependencies (if package.json changed)
pnpm install

# 5. Run database migrations (if schema changed)
pnpm db:push

# 6. Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d

# 7. Verify deployment
docker ps
docker logs bitchange-pro-app-1 --tail 50
```

### Quick Deployment (No Docker Rebuild)
```bash
# If only code changes, no dependencies or schema changes
cd /opt/bitchange-pro
git pull origin main
docker restart bitchange-pro-app-1
```

### Rollback to Previous Version
```bash
# View git history
git log --oneline -10

# Rollback to specific commit
git reset --hard <commit-hash>

# Rebuild containers
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 📊 Monitoring & Logs

### Application Logs
```bash
# Real-time application logs
docker logs -f bitchange-pro-app-1

# Filter for errors only
docker logs bitchange-pro-app-1 2>&1 | grep ERROR

# Filter for specific user activity
docker logs bitchange-pro-app-1 2>&1 | grep "userId: 123"
```

### System Health Dashboard
- **URL:** https://bitchangemoney.xyz/admin/system-health
- **Access:** Admin users only
- **Metrics:**
  - API Response Times
  - Error Rates
  - Database Performance
  - Exchange API Health
  - Recent Errors Log

### Performance Metrics
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check Docker disk usage
docker system df
```

### Database Performance
```sql
-- Show slow queries (queries taking > 1 second)
SELECT * FROM systemMetrics 
WHERE metricType = 'db_query' 
AND CAST(value AS DECIMAL(10,2)) > 1000 
ORDER BY createdAt DESC 
LIMIT 20;

-- Show error rate
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN statusCode >= 400 THEN 1 ELSE 0 END) as errors,
  (SUM(CASE WHEN statusCode >= 400 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as error_rate
FROM apiLogs
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

---

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check if port 3000 is already in use
netstat -tulpn | grep 3000

# Check Docker logs for errors
docker logs bitchange-pro-app-1

# Verify environment variables
docker exec bitchange-pro-app-1 env | grep DATABASE_URL

# Restart container
docker restart bitchange-pro-app-1
```

### Database Connection Issues
```bash
# Check if MySQL is running
docker ps | grep db

# Test database connection
docker exec bitchange-pro-db-1 mysqladmin ping

# Check database logs
docker logs bitchange-pro-db-1 --tail 100

# Restart database
docker restart bitchange-pro-db-1
```

### High Memory Usage
```bash
# Check container memory usage
docker stats --no-stream

# Restart application to free memory
docker restart bitchange-pro-app-1

# Clean up unused Docker resources
docker system prune -a
```

### SSL Certificate Issues
```bash
# Check certificate expiration
docker exec bitchange-pro-nginx-1 certbot certificates

# Renew certificate manually
docker exec bitchange-pro-nginx-1 certbot renew

# Restart nginx
docker restart bitchange-pro-nginx-1
```

### Git Pull Fails
```bash
# Discard local changes and force pull
git fetch origin
git reset --hard origin/main

# Or stash local changes
git stash
git pull origin main
git stash pop
```

---

## 📞 Emergency Contacts

**Critical Issues:**
- Check System Health Dashboard: https://bitchangemoney.xyz/admin/system-health
- Email alerts are sent to: admin@bitchangemoney.xyz
- Alert thresholds:
  - Error Rate > 5%
  - Response Time > 1000ms
  - Database Query > 500ms
  - Exchange API Failure > 10%

**Backup Strategy:**
- Database backups: Daily automated backups
- Code backups: GitHub repository (https://github.com/...)
- Configuration backups: Docker volumes

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Rotate passwords regularly** - Database, SSH, API keys
3. **Monitor failed login attempts** - Check `loginHistory` table
4. **Review audit logs** - Check `systemLogs` table daily
5. **Keep dependencies updated** - Run `pnpm update` monthly
6. **Monitor SSL certificate expiration** - Auto-renewal should work, but verify
7. **Backup database before major changes** - Use mysqldump command above

---

## 📝 Notes

- All times in logs are in UTC
- Application runs in production mode (`NODE_ENV=production`)
- Hot reload is disabled in production
- Source maps are disabled for performance
- Monitoring system runs checks every 5 minutes
- Alert emails are sent via SendGrid

---

**Last Updated:** December 20, 2025
**Version:** 1.0.0
**Maintained By:** BitChange Pro DevOps Team
