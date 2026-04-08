#!/bin/bash
set -e

# TrueNAS backup script for Travel Expense Manager

DEPLOY_DIR="/mnt/tank/apps/travelexpensinator"
BACKUP_DIR="$DEPLOY_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 Backing up Travel Expense Manager..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Stop containers temporarily for consistent backup
echo "⏸️  Stopping containers..."
cd "$DEPLOY_DIR"
docker-compose -f docker-compose.truenas.yml stop

# Backup database
echo "🗄️  Backing up database..."
cp "$DEPLOY_DIR/data/app.db" "$BACKUP_DIR/app_${TIMESTAMP}.db"

# Backup uploads
echo "📎 Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$DEPLOY_DIR" uploads

# Restart containers
echo "▶️  Restarting containers..."
docker-compose -f docker-compose.truenas.yml start

# Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
ls -t "$BACKUP_DIR"/app_*.db | tail -n +11 | xargs rm -f || true
ls -t "$BACKUP_DIR"/uploads_*.tar.gz | tail -n +11 | xargs rm -f || true

echo "✅ Backup complete: $BACKUP_DIR"
echo "📊 Database: app_${TIMESTAMP}.db"
echo "📎 Uploads: uploads_${TIMESTAMP}.tar.gz"