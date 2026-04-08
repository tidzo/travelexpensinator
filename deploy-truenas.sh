#!/bin/bash
set -e

# TrueNAS deployment script for Travel Expense Manager

echo "🚀 Deploying Travel Expense Manager to TrueNAS..."

# Check if we're running on TrueNAS
if [[ ! -d "/mnt" ]]; then
    echo "❌ Error: This script should be run on TrueNAS"
    exit 1
fi

# Set deployment directory
DEPLOY_DIR="/mnt/tank/apps/travelexpensinator"

# Create directories if they don't exist
echo "📁 Creating TrueNAS datasets/directories..."
mkdir -p "$DEPLOY_DIR"/{data,uploads,backups}

# Set proper permissions
chmod 755 "$DEPLOY_DIR"
chmod 755 "$DEPLOY_DIR"/{data,uploads,backups}

# Build and start the application
echo "🐳 Building and starting Docker containers..."
cd "$DEPLOY_DIR"

# Use TrueNAS-specific docker-compose
docker-compose -f docker-compose.truenas.yml down || true
docker-compose -f docker-compose.truenas.yml build --no-cache
docker-compose -f docker-compose.truenas.yml up -d

echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your app at:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}'):5173"
echo "   Backend:  http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "📊 Monitor with: docker-compose -f docker-compose.truenas.yml logs -f"
echo "🛑 Stop with:    docker-compose -f docker-compose.truenas.yml down"