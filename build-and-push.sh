#!/bin/bash
set -e

# Build and push Travel Expense Manager images to Docker Hub
# Usage: ./build-and-push.sh [your-dockerhub-username]

DOCKER_USER=${1:-"yourusername"}
IMAGE_TAG=${2:-"latest"}

echo "🏗️  Building and pushing Travel Expense Manager images..."
echo "📝 Docker Hub username: $DOCKER_USER"
echo "🏷️  Tag: $IMAGE_TAG"

# Build frontend image
echo "🎨 Building frontend image..."
docker build -t "$DOCKER_USER/travelexpensinator-frontend:$IMAGE_TAG" ./frontend

# Build backend image
echo "⚙️  Building backend image..."
docker build -t "$DOCKER_USER/travelexpensinator-backend:$IMAGE_TAG" ./backend

# Push to Docker Hub
echo "☁️  Pushing images to Docker Hub..."
docker push "$DOCKER_USER/travelexpensinator-frontend:$IMAGE_TAG"
docker push "$DOCKER_USER/travelexpensinator-backend:$IMAGE_TAG"

echo "✅ Images pushed successfully!"
echo ""
echo "🔗 Frontend: $DOCKER_USER/travelexpensinator-frontend:$IMAGE_TAG"
echo "🔗 Backend:  $DOCKER_USER/travelexpensinator-backend:$IMAGE_TAG"
echo ""
echo "📋 Use these image names in your TrueNAS docker-compose.yml"