#!/bin/bash
set -e

# Build multi-architecture images for Travel Expense Manager
# This will work on both ARM64 (Apple Silicon) and AMD64 (Intel/TrueNAS)

DOCKER_USER="tidzo"
IMAGE_TAG="latest"

echo "🏗️  Building multi-architecture Travel Expense Manager images..."
echo "📝 Docker Hub username: $DOCKER_USER"
echo "🏷️  Tag: $IMAGE_TAG"

# Enable Docker buildx for multi-platform builds
echo "🔧 Setting up Docker buildx..."
docker buildx create --name multiarch-builder --use || docker buildx use multiarch-builder

# Build and push frontend image for multiple architectures
echo "🎨 Building frontend image for linux/amd64,linux/arm64..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "$DOCKER_USER/travelexpensinator-frontend:$IMAGE_TAG" \
    --push \
    ./frontend

# Build and push backend image for multiple architectures
echo "⚙️  Building backend image for linux/amd64,linux/arm64..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "$DOCKER_USER/travelexpensinator-backend:$IMAGE_TAG" \
    --push \
    ./backend

echo "✅ Multi-architecture images pushed successfully!"
echo ""
echo "🔗 Frontend: $DOCKER_USER/travelexpensinator-frontend:$IMAGE_TAG"
echo "🔗 Backend:  $DOCKER_USER/travelexpensinator-backend:$IMAGE_TAG"
echo ""
echo "✅ These images will now work on both ARM64 and AMD64 systems!"