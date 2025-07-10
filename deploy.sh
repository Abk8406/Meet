#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t burger-queen-frontend .

# Stop and remove existing container if it exists
echo "🛑 Stopping existing container..."
docker stop burger-queen-frontend 2>/dev/null || true
docker rm burger-queen-frontend 2>/dev/null || true

# Run the new container
echo "▶️ Starting new container..."
docker run -d \
  --name burger-queen-frontend \
  -p 80:80 \
  --restart unless-stopped \
  burger-queen-frontend

echo "✅ Deployment completed!"
echo "🌐 Your application is now running at: http://localhost"
echo "📊 Container status:"
docker ps | grep burger-queen-frontend 